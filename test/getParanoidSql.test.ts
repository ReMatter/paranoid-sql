import { test } from 'test';
import { strictEqual } from 'assert';
import { getParanoidSql } from '../src/getParanoidSql';

test('query with no where', () => {
  strictEqual(getParanoidSql('SELECT * FROM t'), 'SELECT * FROM `t` WHERE `t`.`deletedAt` IS NULL');
});

test('query with ? as replacement', () => {
  strictEqual(
    getParanoidSql('SELECT * FROM t WHERE status = ?'),
    'SELECT * FROM `t` WHERE `status` = ? AND `t`.`deletedAt` IS NULL',
  );
});

test('query with :var as replacement', () => {
  strictEqual(
    getParanoidSql('SELECT * FROM t WHERE status = :status'),
    'SELECT * FROM `t` WHERE `status` = :status AND `t`.`deletedAt` IS NULL',
  );
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

test('query with subquery inside function', () => {
  strictEqual(
    getParanoidSql('SELECT t.*, COALESCE((SELECT AVG(age) FROM u WHERE u.id = t.id), 0) FROM t'),
    'SELECT `t`.*, COALESCE((SELECT AVG(`age`) FROM `u` WHERE `u`.`id` = `t`.`id` AND `u`.`deletedAt` IS NULL), 0) FROM `t` WHERE `t`.`deletedAt` IS NULL',
  );
});

test('query with join', () => {
  strictEqual(
    getParanoidSql('SELECT t.id, u.name FROM t INNER JOIN u ON t.id = u.tid'),
    'SELECT `t`.`id`, `u`.`name` FROM `t` INNER JOIN `u` ON `t`.`id` = `u`.`tid` WHERE `t`.`deletedAt` IS NULL AND `u`.`deletedAt` IS NULL',
  );
});

test('queries with union', () => {
  strictEqual(
    getParanoidSql('SELECT t.name FROM t UNION SELECT u.name FROM u'),
    'SELECT `t`.`name` FROM `t` WHERE `t`.`deletedAt` IS NULL UNION SELECT `u`.`name` FROM `u` WHERE `u`.`deletedAt` IS NULL',
  );
});

test('queries with union sum', () => {
  strictEqual(
    getParanoidSql(
      'SELECT SUM(v.qty) FROM (SELECT t.qty FROM t UNION ALL SELECT u.qty FROM u) AS v',
    ),
    'SELECT SUM(`v`.`qty`) FROM (SELECT `t`.`qty` FROM `t` WHERE `t`.`deletedAt` IS NULL UNION ALL SELECT `u`.`qty` FROM `u` WHERE `u`.`deletedAt` IS NULL) AS `v`',
  );
});

test('query with cte', () => {
  strictEqual(
    getParanoidSql(
      'WITH cte AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY id, uid ORDER BY time DESC) ranking FROM t) SELECT id FROM cte WHERE ranking = 1',
    ),
    'WITH cte AS (SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `id`, `uid` ORDER BY `time` DESC) AS `ranking` FROM `t` WHERE `t`.`deletedAt` IS NULL) SELECT `id` FROM `cte` WHERE `ranking` = 1',
  );
});

test('select of query', () => {
  strictEqual(
    getParanoidSql('SELECT (SELECT count(*) FROM t)'),
    'SELECT (SELECT COUNT(*) FROM `t` WHERE `t`.`deletedAt` IS NULL)',
  );
});

test('arithmetic between queries', () => {
  strictEqual(
    getParanoidSql('SELECT ((SELECT count(*) FROM t) / (SELECT count(*) FROM u))'),
    'SELECT ((SELECT COUNT(*) FROM `t` WHERE `t`.`deletedAt` IS NULL) / (SELECT COUNT(*) FROM `u` WHERE `u`.`deletedAt` IS NULL))',
  );
});

test('select case', () => {
  strictEqual(
    getParanoidSql(
      `SELECT u.name, (SELECT CASE t.type WHEN 'a' THEN 1 WHEN 'b' THEN 2 ELSE 0 END FROM (SELECT u.type) AS t) AS code FROM u`,
    ),
    "SELECT `u`.`name`, (SELECT CASE `t`.`type` WHEN 'a' THEN 1 WHEN 'b' THEN 2 ELSE 0 END FROM (SELECT `u`.`type`) AS `t`) AS `code` FROM `u` WHERE `u`.`deletedAt` IS NULL",
  );
});

test('select case when exists', () => {
  strictEqual(
    getParanoidSql('SELECT CASE WHEN EXISTS (SELECT 1 FROM t) THEN 1 ELSE 0 END'),
    'SELECT CASE WHEN EXISTS(SELECT 1 FROM `t` WHERE `t`.`deletedAt` IS NULL) THEN 1 ELSE 0 END',
  );
});

test('select case when exists and when not exits', () => {
  strictEqual(
    getParanoidSql(
      'SELECT CASE WHEN EXISTS (SELECT 1 FROM t) THEN 1 WHEN NOT EXISTS (SELECT 1 FROM u) THEN -1 ELSE 0 END',
    ),
    'SELECT CASE WHEN EXISTS(SELECT 1 FROM `t` WHERE `t`.`deletedAt` IS NULL) THEN 1 WHEN NOT EXISTS (SELECT 1 FROM `u` WHERE `u`.`deletedAt` IS NULL) THEN -1 ELSE 0 END',
  );
});

test('select case when exists with query in the end', () => {
  strictEqual(
    getParanoidSql(
      'SELECT CASE WHEN EXISTS (SELECT 1 FROM t) THEN 1 ELSE (SELECT count(*) FROM u) END',
    ),
    'SELECT CASE WHEN EXISTS(SELECT 1 FROM `t` WHERE `t`.`deletedAt` IS NULL) THEN 1 ELSE (SELECT COUNT(*) FROM `u` WHERE `u`.`deletedAt` IS NULL) END',
  );
});

test('select from derived table', () => {
  strictEqual(
    getParanoidSql('SELECT * FROM (SELECT * FROM t) AS u'),
    'SELECT * FROM (SELECT * FROM `t` WHERE `t`.`deletedAt` IS NULL) AS `u`',
  );
});
