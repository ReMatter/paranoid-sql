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

const updateAST = (ast: AST) => {
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
    if (Array.isArray(ast.columns)) {
      ast.columns.forEach(({ expr }) => {
        const ast: AST = expr.ast;
        updateAST(ast);
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - this is a bug in the node-sql-parser library
  if (ast?._next) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - this is a bug in the node-sql-parser library
    updateAST(ast._next as AST);
  }
};

export const getParanoidSql = (sql: string): string => {
  if (!parser) {
    parser = new Parser();
  }
  const ast = parser.astify(sql) as AST;
  updateAST(ast);
  return parser.sqlify(ast);
};
