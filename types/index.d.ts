declare module '@florajs/sql-parser' {
  class Parser {
    parse(sql: string): any;
  }

  namespace util {
    const astToSQL: (ast: any) => string;
  }
}
