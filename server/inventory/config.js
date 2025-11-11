const inventoryConfig = require('../../src/data/inventoryConfig.json');

const INVENTORY_SEED = inventoryConfig.seed ?? {};
const INVENTORY_KEY_OVERRIDES = inventoryConfig.overrides ?? {};

module.exports = {
  INVENTORY_SEED,
  INVENTORY_KEY_OVERRIDES
};
