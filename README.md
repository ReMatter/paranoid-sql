# paranoid-sql

> Add conditions to verify rows are not soft deleted.

## Installation

    $ npm i @rematter/paranoid-sql
    OR
    $ yarn add @rematter/paranoid-sql

## Usage

```js
import { getParanoidSql } from '@rematter/paranoid-sql';

const paranoidSql = getParanoidSql('SELECT * FROM t WHERE status = ?')

paranoidSql // => 'SELECT * FROM `t` WHERE `status` = ? AND `t`.`deletedAt` IS NULL'
```

## Built With

- [`node-sql-parser`](https://github.com/taozhi8833998/node-sql-parser) - Parse simple SQL statements into an abstract syntax tree (AST) with the visited tableList, columnList and convert it back to SQL.

## Authors/maintainers

- **Nico Gallinal** - [nicoabie](https://github.com/nicoabie)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
