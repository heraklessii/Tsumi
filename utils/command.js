const fs = require("fs").promises;
const path = require("path");
const slash = require("./slash.js");

module.exports = async (client) => {
    let cmdArray = [];

    const categories = await fs.readdir("./commands");

    await Promise.all(categories.map(async (category) => {
        const commandFiles = await fs.readdir(path.join("./commands", category));

        const jsFiles = commandFiles.filter((file) => file.endsWith(".js"));
        console.log(`${category} | klasöründen ${jsFiles.length} komut yükleniyor.`);

        await Promise.all(jsFiles.map(async (cmd) => {
            const command = require(`../commands/${category}/${cmd}`);
            client.commands.set(command.data.name, command);
            cmdArray.push(command);
        }));
    }));

    const finalArray = cmdArray.map((e) => e.data.toJSON());
    await slash.register(client.user.id, finalArray);
};
