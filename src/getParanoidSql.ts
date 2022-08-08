import { Parser, util } from '@florajs/sql-parser';
import { forEach } from 'traverse';

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

const getTableAliases = (descriptors: { table: string; as?: string }[]) =>
  descriptors.map(({ table, as }) => as ?? table);

export const getParanoidSql = (sql: string): string => {
  if (!parser) {
    parser = new Parser();
  }
  const ast = parser.parse(sql);
  forEach(ast, function (n) {
    if (n.type === 'select') {
      const tableAliases = getTableAliases(n.from);
      const paranoidConditions = buildParanoidConditions(tableAliases);
      if (n.where) {
        n.where = {
          type: 'binary_expr',
          operator: 'AND',
          left: n.where,
          right: paranoidConditions,
        };
      } else {
        n.where = paranoidConditions;
      }
      if (Array.isArray(n.columns)) {
        n.columns.forEach(({ expr }: { expr: any }) => {
          if (expr.type === 'select') {
            const tableAliases = getTableAliases(expr.from);
            const paranoidConditions = buildParanoidConditions(tableAliases);
            if (expr.where) {
              expr.where = {
                type: 'binary_expr',
                operator: 'AND',
                left: expr.where,
                right: paranoidConditions,
              };
            } else {
              expr.where = paranoidConditions;
            }
          }
        });
      }
    }
    // console.log(n);
    this.update('');
  });

  return util.astToSQL(ast);
};
