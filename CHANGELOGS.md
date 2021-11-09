## Nemudroid v0.2.0 Changelogs
> 9 Nov 2021 7:00 PM +8 GMT


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
