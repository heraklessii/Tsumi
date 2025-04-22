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
