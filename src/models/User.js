const bcryptjs = require('bcryptjs');

// Also update any bcrypt.hash calls to bcryptjs.hash
// For example:
// Before: const hashedPassword = await bcrypt.hash(password, 10);
// After: const hashedPassword = await bcryptjs.hash(password, 10); 