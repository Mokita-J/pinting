use std::collections::HashMap;
use pintc::predicate::Contract;

use crate::chumsky::{Expr, Spanned};
pub enum ImCompleteCompletionItem {
    Variable(String),
}
/// return (need_to_continue_search, founded reference)
pub fn completion(
    ast: &Contract,
    ident_offset: usize,
) -> HashMap<String, ImCompleteCompletionItem> {
    let mut map = HashMap::new();

    // collect params variable
    
    ast.storage.iter().for_each(|item| {
        let (storage_vars, span) = item;
        //if span.end() > ident_offset && span.start() < ident_offset {
            storage_vars.iter().for_each(|var| {    
                map.insert(
                    var.name.to_string(),
                    ImCompleteCompletionItem::Variable(var.name.to_string()),
                );
            });
        //};
            //get_completion_of(&v.body, &mut map, ident_offset);
    });

    map
}

pub fn get_completion_of(
    expr: &Spanned<Expr>,
    definition_map: &mut HashMap<String, ImCompleteCompletionItem>,
    ident_offset: usize,
) -> bool {
    match &expr.0 {
        Expr::Error => true,
        Expr::Value(_) => true,
        // Expr::List(exprs) => exprs
        //     .iter()
        //     .for_each(|expr| get_definition(expr, definition_ass_list)),
        Expr::Local(local) => {
            !(ident_offset >= local.1.start && ident_offset < local.1.end)
        }
        Expr::Let(name, lhs, rest, _name_span) => {
            definition_map.insert(
                name.clone(),
                ImCompleteCompletionItem::Variable(name.clone()),
            );
            match get_completion_of(lhs, definition_map, ident_offset) {
                true => get_completion_of(rest, definition_map, ident_offset),
                false => false,
            }
        }
        Expr::Then(first, second) => match get_completion_of(first, definition_map, ident_offset) {
            true => get_completion_of(second, definition_map, ident_offset),
            false => false,
        },
        Expr::Binary(lhs, _op, rhs) => match get_completion_of(lhs, definition_map, ident_offset) {
            true => get_completion_of(rhs, definition_map, ident_offset),
            false => false,
        },
        Expr::Call(callee, args) => {
            match get_completion_of(callee, definition_map, ident_offset) {
                true => {}
                false => return false,
            }
            for expr in &args.0 {
                match get_completion_of(expr, definition_map, ident_offset) {
                    true => continue,
                    false => return false,
                }
            }
            true
        }
        Expr::If(test, consequent, alternative) => {
            match get_completion_of(test, definition_map, ident_offset) {
                true => {}
                false => return false,
            }
            match get_completion_of(consequent, definition_map, ident_offset) {
                true => {}
                false => return false,
            }
            get_completion_of(alternative, definition_map, ident_offset)
        }
        Expr::Print(expr) => get_completion_of(expr, definition_map, ident_offset),
        Expr::List(lst) => {
            for expr in lst {
                match get_completion_of(expr, definition_map, ident_offset) {
                    true => continue,
                    false => return false,
                }
            }
            true
        }
    }
}
