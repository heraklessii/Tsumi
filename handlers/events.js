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

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const boxen = require("boxen").default;

module.exports = (client) => {
  const eventsPath = path.join(__dirname, "../events");
  const eventFolders = fs.readdirSync(eventsPath).filter(folder =>
    fs.lstatSync(path.join(eventsPath, folder)).isDirectory()
  );

  for (const folder of eventFolders) {
    const folderPath = path.join(eventsPath, folder);
    const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

    // Boxen içeriği
    const header = `${chalk.magenta.bold("⚙️ Event klasörü:")} ${chalk.cyan(folder)} (${eventFiles.length} dosya)`;
    const list = eventFiles.map(f => `• ${chalk.yellow(f.replace(".js", ""))}`).join("\n");

    console.log(
      boxen(`${header}\n${list}`, {
        padding: [0, 1],
        margin: 0,
        borderColor: "magenta",
        borderStyle: "round"
      })
    );

    for (const file of eventFiles) {
      const filePath = path.join(folderPath, file);
      const event = require(filePath);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }
  }
};
