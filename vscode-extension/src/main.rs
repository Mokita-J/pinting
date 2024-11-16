use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::fs::File;
use std::io::Write;
use fxhash::FxBuildHasher;
use pintc::error::Handler;

use dashmap::DashMap;
use pint_language_server::chumsky::{
    type_inference, ImCompleteSemanticToken,
};
use pint_language_server::completion::completion;
use pint_language_server::jump_definition::get_definition;
use pint_language_server::reference::get_reference;
use pint_language_server::semantic_token::{semantic_token_from_ast, LEGEND_TYPE};
use ropey::Rope;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::notification::Notification;
use tower_lsp::lsp_types::*;
use tower_lsp::{Client, LanguageServer, LspService, Server};
#[derive(Debug)]
struct Backend {
    client: Client,
    ast_map: DashMap<String, pintc::predicate::Contract>,
    document_map: DashMap<String, Rope>,
    semantic_token_map: DashMap<String, Vec<ImCompleteSemanticToken>>,

}

#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            server_info: None,
            offset_encoding: None,
            capabilities: ServerCapabilities {
                inlay_hint_provider: Some(OneOf::Left(true)),
                text_document_sync: Some(TextDocumentSyncCapability::Kind(
                    TextDocumentSyncKind::FULL,
                )),
                completion_provider: Some(CompletionOptions {
                    resolve_provider: Some(false),
                    trigger_characters: Some(vec!["".to_string()]),
                    work_done_progress_options: Default::default(),
                    all_commit_characters: None,
                    completion_item: None,
                }),
                execute_command_provider: Some(ExecuteCommandOptions {
                    commands: vec!["dummy.do_something".to_string()],
                    work_done_progress_options: Default::default(),
                }),

                workspace: Some(WorkspaceServerCapabilities {
                    workspace_folders: Some(WorkspaceFoldersServerCapabilities {
                        supported: Some(true),
                        change_notifications: Some(OneOf::Left(true)),
                    }),
                    file_operations: None,
                }),
                semantic_tokens_provider: Some(
                    SemanticTokensServerCapabilities::SemanticTokensRegistrationOptions(
                        SemanticTokensRegistrationOptions {
                            text_document_registration_options: {
                                TextDocumentRegistrationOptions {
                                    document_selector: Some(vec![DocumentFilter {
                                        language: Some("nrs".to_string()),
                                        scheme: Some("file".to_string()),
                                        pattern: None,
                                    }]),
                                }
                            },
                            semantic_tokens_options: SemanticTokensOptions {
                                work_done_progress_options: WorkDoneProgressOptions::default(),
                                legend: SemanticTokensLegend {
                                    token_types: LEGEND_TYPE.into(),
                                    token_modifiers: vec![],
                                },
                                range: Some(true),
                                full: Some(SemanticTokensFullOptions::Bool(true)),
                            },
                            static_registration_options: StaticRegistrationOptions::default(),
                        },
                    ),
                ),
                // definition: Some(GotoCapability::default()),
                definition_provider: Some(OneOf::Left(true)),
                references_provider: Some(OneOf::Left(true)),
                rename_provider: Some(OneOf::Left(true)),
                ..ServerCapabilities::default()
            },
        })
    }
    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "initialized!")
            .await;
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }

    async fn did_open(&self, params: DidOpenTextDocumentParams) {
        self.client
            .log_message(MessageType::INFO, "file opened!")
            .await;
        self.on_change(TextDocumentItem {
            uri: params.text_document.uri,
            text: params.text_document.text,
            version: params.text_document.version,
        }).await

        
    }

    async fn did_change(&self, mut params: DidChangeTextDocumentParams) {
        
        self.client
            .log_message(MessageType::INFO, "file CHANGED!")
            .await;
        self.on_change(TextDocumentItem {
            uri: params.text_document.uri,
            text: std::mem::take(&mut params.content_changes[0].text),
            version: params.text_document.version,
        })
        .await
    }

    async fn did_save(&self, _: DidSaveTextDocumentParams) {
        self.client
            .log_message(MessageType::INFO, "file saved!")
            .await;
    }
    async fn did_close(&self, _: DidCloseTextDocumentParams) {
        self.client
            .log_message(MessageType::INFO, "file closed!")
            .await;
    }

    // TODO:    //async fn goto_definition(
    // TODO:     //async fn references(&self, params: ReferenceParams) -> Result<Option<Vec<Location>>> {


   async fn semantic_tokens_full(
       &self,
       params: SemanticTokensParams,
   ) -> Result<Option<SemanticTokensResult>> {
        Ok(None)
    }

    async fn semantic_tokens_range(
        &self,
        params: SemanticTokensRangeParams,
    ) -> Result<Option<SemanticTokensRangeResult>> {
        let uri = params.text_document.uri.to_string();
        let semantic_tokens = || -> Option<Vec<SemanticToken>> {
            let im_complete_tokens = self.semantic_token_map.get(&uri)?;
            let rope = self.document_map.get(&uri)?;
            let mut pre_line = 0;
            let mut pre_start = 0;
            let semantic_tokens = im_complete_tokens
                .iter()
                .filter_map(|token| {
                    let line = rope.try_byte_to_line(token.start).ok()? as u32;
                    let first = rope.try_line_to_char(line as usize).ok()? as u32;
                    let start = rope.try_byte_to_char(token.start).ok()? as u32 - first;
                    let ret = Some(SemanticToken {
                        delta_line: line - pre_line,
                        delta_start: if start >= pre_start {
                            start - pre_start
                        } else {
                            start
                        },
                        length: token.length as u32,
                        token_type: token.token_type as u32,
                        token_modifiers_bitset: 0,
                    });
                    pre_line = line;
                    pre_start = start;
                    ret
                })
                .collect::<Vec<_>>();
            Some(semantic_tokens)
        }();
        if let Some(semantic_token) = semantic_tokens {
            return Ok(Some(SemanticTokensRangeResult::Tokens(SemanticTokens {
                result_id: None,
                data: semantic_token,
            })));
        }
        Ok(None)
    }


   async fn inlay_hint(
       &self,
       params: tower_lsp::lsp_types::InlayHintParams,
   ) -> Result<Option<Vec<InlayHint>>> {
   
    Ok(None)
   }

   async fn completion(&self, params: CompletionParams) -> Result<Option<CompletionResponse>> {
       self.client
           .log_message(MessageType::INFO, "completion requested!")
           .await;
       let uri = params.text_document_position.text_document.uri;
       let position = params.text_document_position.position;
       let completions = || -> Option<Vec<CompletionItem>> {
           let rope = self.document_map.get(&uri.to_string())?;
           let ast = self.ast_map.get(&uri.to_string())?;
           let char = rope.try_line_to_char(position.line as usize).ok()?;
           let offset = char + position.character as usize;
           

           let completions = completion(&ast, offset);

           let mut ret = Vec::with_capacity(completions.len());
           for (_, item) in completions {
               match item {
                   pint_language_server::completion::ImCompleteCompletionItem::Variable(var) => {
                       ret.push(CompletionItem {
                           label: var.clone(),
                           insert_text: Some(var.clone()),
                           kind: Some(CompletionItemKind::VARIABLE),
                           detail: Some(var),
                           sort_text: Some("c".to_string()),
                           ..Default::default()
                       });
                   },

                   pint_language_server::completion::ImCompleteCompletionItem::Type(var) => {
                    ret.push(CompletionItem {
                        label: var.clone(),
                        insert_text: Some(var.clone()),
                        kind: Some(CompletionItemKind::CLASS),
                        detail: Some(var),
                        sort_text: Some("b".to_string()),
                        ..Default::default()
                    });
                },

                pint_language_server::completion::ImCompleteCompletionItem::Keyword(var) => {
                    ret.push(CompletionItem {
                        label: var.clone(),
                        insert_text: Some(var.clone()),
                        kind: Some(CompletionItemKind::KEYWORD),
                        detail: Some(var),
                        sort_text: Some("a".to_string()),
                        ..Default::default()
                    });
                }

                pint_language_server::completion::ImCompleteCompletionItem::StorageVariable(var) => {
                    ret.push(CompletionItem {
                        label: var.clone(),
                        insert_text: Some(var.clone()),
                        kind: Some(CompletionItemKind::FIELD),
                        detail: Some(var),
                        sort_text: Some("d".to_string()),
                        ..Default::default()
                    });
                }
               }
           }
           Some(ret)
       }();
       
       Ok(completions.map(CompletionResponse::Array))
   }

//   async fn rename(&self, params: RenameParams) -> Result<Option<WorkspaceEdit>> {
//       let workspace_edit = || -> Option<WorkspaceEdit> {
//           let uri = params.text_document_position.text_document.uri;
//           let ast = self.ast_map.get(&uri.to_string())?;
//           let rope = self.document_map.get(&uri.to_string())?;
//
//           let position = params.text_document_position.position;
//           let char = rope.try_line_to_char(position.line as usize).ok()?;
//           let offset = char + position.character as usize;
//           let reference_list = get_reference(&ast, offset, true);
//           let new_name = params.new_name;
//           if !reference_list.is_empty() {
//               let edit_list = reference_list
//                   .into_iter()
//                   .filter_map(|(_, range)| {
//                       let start_position = offset_to_position(range.start, &rope)?;
//                       let end_position = offset_to_position(range.end, &rope)?;
//                       Some(TextEdit::new(
//                           Range::new(start_position, end_position),
//                           new_name.clone(),
//                       ))
//                   })
//                   .collect::<Vec<_>>();
//               let mut map = HashMap::new();
//               map.insert(uri, edit_list);
//               let workspace_edit = WorkspaceEdit::new(map);
//               Some(workspace_edit)
//           } else {
//               None
//           }
//       }();
//       Ok(workspace_edit)
//   }

    async fn did_change_configuration(&self, _: DidChangeConfigurationParams) {
        self.client
            .log_message(MessageType::INFO, "configuration changed!")
            .await;
    }

    async fn did_change_workspace_folders(&self, _: DidChangeWorkspaceFoldersParams) {
        self.client
            .log_message(MessageType::INFO, "workspace folders changed!")
            .await;
    }

    async fn did_change_watched_files(&self, _: DidChangeWatchedFilesParams) {
        self.client
            .log_message(MessageType::INFO, "watched files have changed!")
            .await;
    }

    async fn execute_command(&self, _: ExecuteCommandParams) -> Result<Option<Value>> {
        self.client
            .log_message(MessageType::INFO, "command executed!")
            .await;

        match self.client.apply_edit(WorkspaceEdit::default()).await {
            Ok(res) if res.applied => self.client.log_message(MessageType::INFO, "applied").await,
            Ok(_) => self.client.log_message(MessageType::INFO, "rejected").await,
            Err(err) => self.client.log_message(MessageType::ERROR, err).await,
        }

        Ok(None)
    }
}
#[derive(Debug, Deserialize, Serialize)]
struct InlayHintParams {
    path: String,
}

enum CustomNotification {}
impl Notification for CustomNotification {
    type Params = InlayHintParams;
    const METHOD: &'static str = "custom/notification";
}
struct TextDocumentItem {
    uri: Url,
    text: String,
    version: i32,
}

struct NonSend {
    name: String
}

impl NonSend {
    fn new() -> Self{
        NonSend {
            name: "name".to_string()
        }
    }

    fn parse(&self, params: &TextDocumentItem, backend: &Backend) -> Vec<Diagnostic>{

        let rope = ropey::Rope::from_str(&params.text);
        let handler = Handler::default();
        //let path = Path::new("/home/javier/test.go");
        //
        let path = "/tmp/pint-lsp";
        let mut file = File::create(path);
    
        // Write the string to the file
        file.expect("failed ot open tmp file").write_all(params.text.as_bytes());

        let path: PathBuf = path.to_string().into();

        let empty_map: HashMap<&str, &Path, FxBuildHasher> = HashMap::with_hasher(FxBuildHasher::default());

        let ast = pintc::parser::parse_project(&handler, &empty_map, &path);
        

        let (parse_errors, _parse_warnings) = handler.consume();


        let diagnostics = parse_errors
            .into_iter()
            .filter_map(|item| {
                let trait_object: &dyn pintc::error::ReportableError = &item;
                let (message, span) = (trait_object.display_raw(), trait_object.span());

            || -> Option<Diagnostic> {
                    let start_position = offset_to_position(span.start(), &rope)?;
                    let end_position = offset_to_position(span.end(), &rope)?;
                    Some(Diagnostic::new_simple(
                        Range::new(start_position, end_position),
                        message,
                    ))
                }()
            })
            .collect::<Vec<_>>();
        
        if ast.is_ok() {
            backend.ast_map.insert(params.uri.to_string(), ast.unwrap());
        }

        diagnostics
    }
}


impl Backend {
    async fn on_change(&self, params: TextDocumentItem) {
        let rope = ropey::Rope::from_str(&params.text);
        self.document_map
            .insert(params.uri.to_string(), rope.clone());

        let non_send_var = Arc::new(Mutex::new(NonSend::new()));
        //let non_send_var = Arc::clone(&non_send_var);

        let data = non_send_var.lock().await;

        let diagnostics = data.parse(&params, &self);
        
        self.client.log_message(MessageType::INFO, diagnostics.len());

        self.client
            .publish_diagnostics(params.uri.clone(), diagnostics, Some(params.version))
            .await;

        // self.client
        //     .log_message(MessageType::INFO, &format!("{:?}", semantic_tokens))
        //     .await;
        //self.semantic_token_map
        //    .insert(params.uri.to_string(), semantic_tokens);
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    env_logger::init();

    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    let (service, socket) = LspService::build(|client| Backend {
        client,
        ast_map: DashMap::new(),
        document_map: DashMap::new(),
        semantic_token_map: DashMap::new(),
    })
    .finish();

    serde_json::json!({"test": 20});
    Server::new(stdin, stdout, socket).serve(service).await;
}

fn offset_to_position(offset: usize, rope: &Rope) -> Option<Position> {
    let line = rope.try_char_to_line(offset).ok()?;
    let first_char_of_line = rope.try_line_to_char(line).ok()?;
    let column = offset - first_char_of_line;
    Some(Position::new(line as u32, column as u32))
}
