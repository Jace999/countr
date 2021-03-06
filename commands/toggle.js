module.exports = {
  description: "Manage modules you can enable or disable in your server.",
  usage: {
    "[<module>]": "The module you want to toggle."
  },
  examples: {
    "allow-spam": "Toggle the module allow-spam."
  },
  aliases: [ "modules", "module" ],
  permissionRequired: 2, // 0 All, 1 Mods, 2 Admins, 3 Server Owner, 4 Bot Admin, 5 Bot Owner
  checkArgs: (args) => !args.length || args.length == 1
}

module.exports.run = async function(client, message, args, config, gdb, prefix, permissionLevel, db) {
  let { modules } = await gdb.get();

  if (!args[0]) return message.channel.send({ embed: {
    title: "📋 Modules",
    description: "Toggle a module with `" + prefix + "toggle <module>`.",
    fields: JSON.parse(JSON.stringify(fields)).map(f => { f.name = f.name + " " + (modules.includes(f.name) ? "✅" : "❌"); return f; }),
    color: config.color,
    footer: { text: "Requested by " + message.author.tag, icon_url: message.author.displayAvatarURL },
    timestamp: Date.now()
  }}).catch(() => message.channel.send("🆘 An unknown error occurred. Do I have permission? (Embed Links)"));

  let _module = args[0].toLowerCase();
  if (!allModules[_module]) return message.channel.send("❌ Invalid module. For help, type `" + prefix + "help toggle`")
  
  if (!modules.includes(_module)) { // preventing loops
    let incompatibles = allModules[_module].incompatibleWith || [];
    for (const incompatibleModule of incompatibles) if (modules.includes(incompatibleModule)) return message.channel.send("❌ This module is incompatible with the module `" + incompatibleModule + "`.");
  }

  gdb.toggleModule(_module)
    .then(state => message.channel.send("✅ The module \`" + _module + "\` has now been " + (state ? "enabled" : "disabled") + "."))
    .catch(e => console.log(e) && message.channel.send("🆘 An unknown database error occurred. Please try again, or contact support."))
}

const allModules = {
  "allow-spam": { description: "Allow people to count multiple times in a row, instead of forcing them to wait for the next person to count first." },
  "talking": { description: "Allow people to send a text message after the count. Ex. `1 Hi there!`" },
  "recover": { description: "Make the bot try to recover itself after it goes offline by removing unprocessed messages in the counting channel when it goes online." },
  "reposting": { description: "Repost the message being sent in a nice embed, preventing the users from editing or self-deleting their count later on.", incompatibleWith: [ "webhook" ] },
  "webhook": { description: "Same as the module `reposting` except that it will repost it in a nice embed, impersonating the user who sent it.", incompatibleWith: [ "reposting" ] }
}, fields = []

for (const moduleName in allModules) fields.push({
  name: moduleName,
  value: allModules[moduleName].description + (allModules[moduleName].incompatibleWith ? "\n**Incompatible with:** " + allModules[moduleName].incompatibleWith.map(m => "\`" + m + "\`").join(", ") : ""),
  inline: true
})