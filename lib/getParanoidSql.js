import { Parser, util } from '@florajs/sql-parser';
import { forEach } from 'traverse';
let parser;
export const getParanoidSql = (sql) => {
    if (!parser) {
        parser = new Parser();
    }
    const ast = parser.parse(sql);
    forEach(ast, function (node) {
        if (node.type === 'Identifier') {
            console.log({ node });
        }
    });
    return util.astToSql(ast);
};
//# sourceMappingURL=getParanoidSql.js.map