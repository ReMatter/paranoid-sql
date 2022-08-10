import { AST, From, Parser } from 'node-sql-parser';

let parser: Parser;

const buildParanoidConditions = (tableAliases: string[]) =>
  tableAliases
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
    .reduce(
      (left, right) =>
        ({
          type: 'binary_expr',
          operator: 'AND',
          left,
          right,
        } as any),
    );

const getTableAliases = (from: From[]) => from.map(({ table, as }) => as ?? table);

export const getParanoidSql = (sql: string): string => {
  if (!parser) {
    parser = new Parser();
  }
  const ast = parser.astify(sql) as AST;
  if (ast.type === 'select') {
    const tableAliases = getTableAliases(ast.from as From[]);
    const paranoidConditions = buildParanoidConditions(tableAliases);
    if (ast.where) {
      ast.where = {
        type: 'binary_expr',
        operator: 'AND',
        left: ast.where,
        right: paranoidConditions,
      };
    } else {
      ast.where = paranoidConditions;
    }
    if (Array.isArray(ast.columns)) {
      ast.columns.forEach(({ expr }) => {
        const ast: AST = expr.ast;
        if (ast?.type === 'select') {
          const tableAliases = getTableAliases(ast.from as From[]);
          const paranoidConditions = buildParanoidConditions(tableAliases);
          if (ast.where) {
            ast.where = {
              type: 'binary_expr',
              operator: 'AND',
              left: ast.where,
              right: paranoidConditions,
            };
          } else {
            ast.where = paranoidConditions;
          }
        }
      });
    }
  }

  return parser.sqlify(ast);
};
