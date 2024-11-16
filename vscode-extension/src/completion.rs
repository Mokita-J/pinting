use std::collections::HashMap;
use pintc::predicate::Contract;

pub enum ImCompleteCompletionItem {
    Variable(String),
}

pub fn completion(
    ast: &Contract,
    ident_offset: usize,
) -> HashMap<String, ImCompleteCompletionItem> {
    let mut map = HashMap::new();

    
    ast.storage.iter().for_each(|item| {
        let (storage_vars, span) = item;
        //if span.end() > ident_offset && span.start() < ident_offset {
            storage_vars.iter().for_each(|var| {    
                map.insert(
                    var.name.to_string(),
                    ImCompleteCompletionItem::Variable(format!("{}{}", "storage::".to_string(), var.name.to_string())),
                );
            });
        //};
    });

    ast.preds.iter().for_each(|pred| {
        map.insert(
            pred.1.name.to_string(),
            ImCompleteCompletionItem::Variable(pred.1.name.to_string().chars().skip(2).collect()), //TODO: remove dots
        );
        pred.1.params.iter().for_each(|param| {
            let key_value= pred.1.name.to_string() + "::" + &param.name.to_string();
            map.insert(
                key_value,
                ImCompleteCompletionItem::Variable(param.name.to_string().chars().skip(2).collect()),
            );
        });

        pred.1.variables.variables().into_iter().for_each(|v |{
            let var_key= pred.1.name.to_string() + "::" + &v.1.name.to_string();
            map.insert(var_key, ImCompleteCompletionItem::Variable(
              v.1.name.to_string().chars().skip(2).collect()));
        });
    });





    map
}

