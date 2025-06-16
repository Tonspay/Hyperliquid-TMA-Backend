
const db = require("./utils/db.js")
require('dotenv').config();

(async () => {
  try {
    console.log(
      await db.getOrder(
        {
          oid:""
        }
      )
    )
  } catch (err) {
    console.error('API error:', err);
  }
})();