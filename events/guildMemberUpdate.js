module.exports = (client, newMem, oldMem) => {
    if (newMem.guild.id !== '874162813977919488') return;

    // Verify role was added
    if ((oldMem.roles.cache.size === 0) && (newMem.roles.cache.size === 1)){
      // Add border roles to member
        newMem.roles.add([
            '918501515445026916',
            '918501825630580846',
            '919534149352714270'
        ]).catch(console.error);
    };
}
