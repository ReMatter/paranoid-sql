import { test } from 'test';
import { strictEqual } from 'assert';
import { getParanoidSql } from '../src/getParanoidSql';

test('query with no where', () => {
  strictEqual(getParanoidSql('SELECT * FROM t'), 'SELECT * FROM `t` WHERE `t`.`deletedAt` IS NULL');
});

test('query with no where and alias', () => {
  strictEqual(
    getParanoidSql('SELECT * FROM t t1'),
    'SELECT * FROM `t` AS `t1` WHERE `t1`.`deletedAt` IS NULL',
  );
});

test('query with where', () => {
  strictEqual(
    getParanoidSql('SELECT * FROM t WHERE t.id = 5'),
    'SELECT * FROM `t` WHERE `t`.`id` = 5 AND `t`.`deletedAt` IS NULL',
  );
});

test('query with where and alias', () => {
  strictEqual(
    getParanoidSql('SELECT * FROM t t1 WHERE t1.id = 5'),
    'SELECT * FROM `t` AS `t1` WHERE `t1`.`id` = 5 AND `t1`.`deletedAt` IS NULL',
  );
});

test('query with subquery', () => {
  strictEqual(
    getParanoidSql('SELECT t.*, (SELECT name FROM u WHERE u.id = t.id) FROM t'),
    'SELECT `t`.*, (SELECT `name` FROM `u` WHERE `u`.`id` = `t`.`id` AND `u`.`deletedAt` IS NULL) FROM `t` WHERE `t`.`deletedAt` IS NULL',
  );
});

test('query with join', () => {
  strictEqual(
    getParanoidSql('SELECT t.id, u.name FROM t INNER JOIN u ON t.id = u.tid'),
    'SELECT `t`.`id`, `u`.`name` FROM `t` INNER JOIN `u` ON `t`.`id` = `u`.`tid` WHERE `t`.`deletedAt` IS NULL AND `u`.`deletedAt` IS NULL',
  );
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - only option is missing in type definition and does not work
// https://github.com/nodejs/node-core-test/issues/39
test('queries with union', { only: true }, () => {
  strictEqual(
    getParanoidSql('SELECT t.name FROM t UNION SELECT u.name FROM u'),
    'SELECT `t`.`name` FROM `t` WHERE `t`.`deletedAt` IS NULL UNION SELECT `u`.`name` FROM `u` WHERE `u`.`deletedAt` IS NULL',
  );
});

// node-sql-parser does not support CTE yet
// https://github.com/taozhi8833998/node-sql-parser/issues/1090
test('query with cte', { skip: true }, () => {
  strictEqual(
    getParanoidSql(
      'WITH cte AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY id, uid ORDER BY time DESC) rank FROM t) SELECT id FROM cte WHERE rank = 1',
    ),
    'WITH `cte` AS (SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `id`, `uid` ORDER BY `time` DESC) AS `rank` FROM `t` WHERE `t`.`deletedAt` IS NULL) SELECT `id` FROM `cte` WHERE `rank` = 1',
  );
});
