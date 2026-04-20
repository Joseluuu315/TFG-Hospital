db.users.find({ role: 'WORKER' }).toArray().forEach(printjson);
