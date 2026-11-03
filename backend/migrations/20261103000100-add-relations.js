'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('Articles', 'userId', {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      }, { transaction });
      await queryInterface.addColumn('Comments', 'userId', {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      }, { transaction });
      await queryInterface.addColumn('Comments', 'articleId', {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'Articles', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      }, { transaction });
      await queryInterface.createTable('Favorites', {
        userId: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        articleId: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, references: { model: 'Articles', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      }, { transaction });
      await queryInterface.createTable('Followers', {
        userId: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        followerId: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      }, { transaction });
      await queryInterface.createTable('TagList', {
        articleId: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, references: { model: 'Articles', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
        tagName: { type: Sequelize.STRING, allowNull: false, primaryKey: true, references: { model: 'Tags', key: 'name' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      }, { transaction });
      await queryInterface.addIndex('Articles', ['userId'], { transaction });
      await queryInterface.addIndex('Comments', ['articleId'], { transaction });
      await queryInterface.addIndex('Comments', ['userId'], { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('TagList', { transaction });
      await queryInterface.dropTable('Followers', { transaction });
      await queryInterface.dropTable('Favorites', { transaction });
      await queryInterface.removeColumn('Comments', 'articleId', { transaction });
      await queryInterface.removeColumn('Comments', 'userId', { transaction });
      await queryInterface.removeColumn('Articles', 'userId', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
