// Tsumi Bot - Discord Bot Project
// Copyright (C) 2025  Tsumi Bot Contributors
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const fs    = require("fs").promises;
const path  = require("path");
const chalk = require("chalk");
const boxen = require("boxen").default;
const slash = require("./slash.js");


module.exports = async (client) => {
  const all = [];
  const categories = await fs.readdir("./commands");

  for (const category of categories) {
    const files = await fs.readdir(path.join("./commands", category));
    const jsFiles = files.filter(f => f.endsWith(".js"));

    const header = `${chalk.cyan.bold("📁 " + category)} klasöründen ${chalk.green(jsFiles.length)} komut yüklendi`;
    const list   = jsFiles.map(f => `• ${chalk.yellow(f.replace(".js",""))}`).join("\n");

    console.log(
      boxen(
        `${header}\n${list}`,
        {
          padding: [0, 1],   
          margin: 0,          
          borderColor: "cyan",
          borderStyle: "round"
        }
      )
    );

    for (const file of jsFiles) {
      const cmd = require(`../commands/${category}/${file}`);
      client.commands.set(cmd.data.name, cmd);
      all.push(cmd.data.toJSON());
    }
  }

  await slash.register(client.user.id, all);
};
