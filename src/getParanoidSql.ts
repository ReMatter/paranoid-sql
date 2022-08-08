import { Parser, util } from '@florajs/sql-parser';
import { forEach } from 'traverse';

let parser: Parser;

const buildParanoidCondition = (tableAlias: string) => ({
  type: 'binary_expr',
  operator: 'IS',
  left: {
    type: 'column_ref',
    table: tableAlias,
    column: 'deletedAt',
  },
  right: { type: 'null', value: null },
});

const getTableAlias = ({ table, as }: { table: string; as?: string }) => as ?? table;

export const getParanoidSql = (sql: string): string => {
  if (!parser) {
    parser = new Parser();
  }
  const ast = parser.parse(sql);
  forEach(ast, function (n) {
    if (n.type === 'select') {
      const tableAlias = getTableAlias(n.from[0]);
      const paranoidCondition = buildParanoidCondition(tableAlias);
      if (n.where) {
        n.where = {
          type: 'binary_expr',
          operator: 'AND',
          left: n.where,
          right: paranoidCondition,
        };
      } else {
        n.where = paranoidCondition;
      }
      // n.columns?.forEach()
    }
    this.update('');
  });

  return util.astToSQL(ast);
};
