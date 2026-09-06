import { argv } from "node:process";

import { deleteAsync } from "del";

console.time("clear");

const deletedDirs = await deleteAsync(argv.slice(2));

console.log(`🔥 deleted: ${deletedDirs.join(",")}`);

console.timeEnd("clear");
