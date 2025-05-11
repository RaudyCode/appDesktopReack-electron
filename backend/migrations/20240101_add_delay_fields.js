'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('prestamos', 'pagosAtrasados', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('prestamos', 'atrasosNoPagados', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('prestamos', 'montoAtrasosNoPagados', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('prestamos', 'semanasConsecutivasAtraso', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('prestamos', 'fechaUltimoAtraso', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    
    // Añadir el nuevo valor 'con pagos parciales' al ENUM de estado
    return queryInterface.sequelize.query(
      `ALTER TYPE enum_prestamos_estado ADD VALUE IF NOT EXISTS 'con pagos parciales'`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('prestamos', 'pagosAtrasados');
    await queryInterface.removeColumn('prestamos', 'atrasosNoPagados');
    await queryInterface.removeColumn('prestamos', 'montoAtrasosNoPagados');
    await queryInterface.removeColumn('prestamos', 'semanasConsecutivasAtraso');
    await queryInterface.removeColumn('prestamos', 'fechaUltimoAtraso');
    
    // No podemos quitar valores de un ENUM en PostgreSQL fácilmente
    // Esto requeriría recrear el tipo ENUM, lo cual está fuera del alcance de este rollback
  }
}; 