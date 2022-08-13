"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParanoidSql = void 0;
const node_sql_parser_1 = require("node-sql-parser");
let parser;
const buildParanoidConditions = (tableAliases) => tableAliases
    .map((tableAlias) => ({
    type: 'binary_expr',
    operator: 'IS',
    left: {
        type: 'column_ref',
        table: tableAlias,
        column: 'deletedAt',
    },
    right: { type: 'null', value: null },
}))
    .reduce((left, right) => ({
    type: 'binary_expr',
    operator: 'AND',
    left,
    right,
}));
const getTableAliases = (from) => from.map(({ table, as }) => as ?? table);
const updateNode = (node) => {
    if (node?.type === 'select') {
        if (Array.isArray(node.with)) {
            node.with.forEach(({ stmt }) => {
                const ast = stmt.ast;
                updateNode(ast);
            });
        }
        else {
            if (node.from) {
                // derived tables
                node.from
                    .filter(({ expr }) => !!expr)
                    .forEach(({ expr }) => {
                    updateNode(expr.ast);
                });
                const simpleTables = node.from.filter(({ expr }) => !expr);
                if (simpleTables.length > 0) {
                    const tableAliases = getTableAliases(simpleTables);
                    const paranoidConditions = buildParanoidConditions(tableAliases);
                    if (node.where) {
                        node.where = {
                            type: 'binary_expr',
                            operator: 'AND',
                            left: node.where,
                            right: paranoidConditions,
                        };
                    }
                    else {
                        node.where = paranoidConditions;
                    }
                }
            }
        }
        if (Array.isArray(node.columns)) {
            node.columns.forEach(({ expr }) => {
                updateNode(expr.ast);
                updateNode(expr.left?.ast);
                updateNode(expr.right?.ast);
                updateNode(expr);
            });
        }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - no function type yet
    if (node?.type === 'function') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - no function type yet
        node.args.value.forEach(({ ast }) => updateNode(ast));
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - no unary_expr type yet
    if (node?.type === 'unary_expr') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - no unary_expr type yet
        updateNode(node.expr.ast);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - no else type yet
    if (node?.type === 'else') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - no else type yet
        updateNode(node.result?.ast);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - no when type yet
    if (node?.type === 'when') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - no when type yet
        updateNode(node.cond);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - no case type yet
    if (node?.type === 'case') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - no case type yet
        node.args.forEach((node) => updateNode(node));
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - this is a bug in the node-sql-parser library
    if (node?._next) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - this is a bug in the node-sql-parser library
        updateNode(node._next);
    }
};
const getParanoidSql = (sql) => {
    if (!parser) {
        parser = new node_sql_parser_1.Parser();
    }
    const ast = parser.astify(sql);
    updateNode(ast);
    return parser.sqlify(ast);
};
exports.getParanoidSql = getParanoidSql;
//# sourceMappingURL=getParanoidSql.js.map