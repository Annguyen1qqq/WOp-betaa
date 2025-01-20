const bcryptjs = require('bcryptjs');

// Update any bcrypt.compare calls to bcryptjs.compare
// For example:
// Before: const isMatch = await bcrypt.compare(password, user.password);
// After: const isMatch = await bcryptjs.compare(password, user.password); 