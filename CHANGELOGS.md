## Nemudroid v0.2.2 Changelogs
> 18 Nov 2021 1:00AM +8:00 GMT

- Change source emoji for Nemudroid's Minesweeper game

## Nemudroid v0.3.0 Changelogs
> 17 Nov 2021 6:00 PM +8:00 GMT

- **Reworked game mechanics**
  - Removed game costs (All games can now be played for free!)
  - Removed steal method under earn (/) command
  - Adjusted rewards for minesweeper (winnings have been adjusted accordingly, but may change again in the forseeable future)
  - Added interaction for find method under earn (/) command

- ✨ **Added hangman (new earn (/) command method)**
  - hangman has finally been added
  - hangman only offers challenges by guessing anime titles
  - Removed number buttons from hangman choices (All buttons are now random alphabet characters)

- ✨ **Added gamestats (new command)**
  - gamestats record your game progress all throughout.
  - compete with others as you reach unimaginable heights reflected on gamestats

- ✨ **Added birthday (new command)**
  - Added the ability to let bot store and remember your birthday
  - Other users may know your birthday with this, but you can opt to hide your birthday from being queried by other
  - Bot will greet you on the day of your birthday (if you set your birthday, and if a server moderator sets a channel for logging birthdays)

- ✨ **Notification system and levelup rewards**
  - Bot can now send a message upon levelup (toggable, defaults to false)
  - Credits are rewarded upon levelup. Expected reward is calculated at:
  *75 + [25 x your level]*
  - Messages will only be sent if you allow the bot to.
  - Messages will only be sent if you levelup via message and not via voice channel
  - You are still rewarded with credits even if you disabled the levelup message.

- ✨ **Logging Leaving Members (Moderators only)**
  - Leaving members are now logged regardless of the reason why they left (ban, leave, kick)
  - Note: This feature is experimental and is unstable.


## Nemudroid v0.2.2 Changelogs
> 10 Nov 2021 1:00AM +8:00 GMT

- Patched probable Voice channel XP grind abuse introduced by LastC.
- Fixed bot's XP being collected while on the Voice Channel.


## Nemudroid v0.2.1 Changelogs
> 9 Nov 2021 10:00PM +8:00 GMT

- Fixed error handling for users using the game feature without credits.


## Nemudroid v0.2.0 Changelogs
> 9 Nov 2021 7:00 PM +8:00 GMT

- **Added functionality to collect XP from VC.**
  - If a user is on a Voice Channel, their xp is collected based on how long they are in the VC.
  - Users cannot collect XP through sending of messages unless they leave the Voice Channel.
  - XP collected on Voice Channels has also reduced rate than the ones collected via sending messages (50% less).

- **Filtering of Messages.**
  - Messages with discord invite links (servers or bots) will be deleted automatically.
  - Mods (Users with Manage Server Permissions) are not affected by this change.

- ✨ **New Feature (Currency)**
  - Users can now earn currency aside from the XP they collect.
  - Currency is entirely independent with the Experience Points (XP).
  - Currency may be used to buy various items.
    - Items in the shop for now only includes EXP Boosters.
    - Items found on others category are still purchasable but is currently unusable. Don't worry if you buy one of them because they are retroactive.
  - Currency may be earned through various methods.
    - You can receive daily rewards whose value increments depending on your streak.
    - Daily rewards reset every 20h.
    - You can beg, find, or steal (which has a cooldown of 4h per use)
    - You can play games (Games are not guaranteed to give credits as you can lose some of them while playing)
    - Games includes "Rock Paper Scissors", "Coin flip", "Minesweeper", and "Captcha solver".
  - Total Credits earned can be viewed through the `\balance` command

- **New Commands**
  - `/shop`
  - `/balance`
  - `/earn Earn Daily reward`
  - `/earn Play RPS (Janken)`
  - `/earn Play CoinFlip`
  - `/earn Play Minesweeper`
  - `/earn Guess Captcha`
  - `/earn find`
  - `/earn beg`
  - `/earn steal`
