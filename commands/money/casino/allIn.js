class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: '올인',
      aliases: ['dhfdls'],
      description: '올인!',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { safeEdit } = this.client.utils
    const { message, GlobalUserData } = compressed
    if (GlobalUserData.money < 10000) {
      message.reply(`${this.client._options.emojis.no}  당신은 ${this.client._options.money.name}가 \`\`10000\`\` ${this.client._options.money.name} 미만이네요.. \`\`${this.client._options.bot.prefix}돈받기\`\` 명령어를 이용하여 ${this.client._options.money.name}를 받아주세요!`)
    } else if (GlobalUserData.money <= 0) {
      message.reply(`${this.client._options.emojis.no}  당신은 ${this.client._options.money.name}가 \`\`0\`\` ${this.client._options.money.name} 이네요.. \`\`${this.client._options.bot.prefix}돈받기\`\` 명령어를 이용하여 ${this.client._options.money.name}를 받아주세요!`)
    } else {
      if (!message.author.isCasino) {
        message.author.isCasino = true
        const BotMessage = await message.channel.send(`${message.member}\n${this.client._options.money.emoji}  올인을 시작할게요! 확률은 절반!\n\n${this.client._options.money.emoji}  올인을 시작하시려면 15초 안에 반응을 눌러주세요!\n`)
        BotMessage.react(this.client._options.money.emoji)
        const filter = (reaction, user) => reaction.emoji.name === this.client._options.money.emoji && user.id === message.author.id
        BotMessage.awaitReactions(filter, { max: 1, time: 15000, errors: ['time'] })
          .then(() => {
            const loadMessage = this.client.randmizer.chooseWeighted(['슬롯 돌리는 중...', '카드게임 하는 중..', '잔고 확인 중..', '물 마시는 중..', '밑장 빼는 중..', '성공 비는 중..'], [55, 20, 20, 2, 1, 2])
            safeEdit(BotMessage, `${message.member}\n${this.client._options.money.emoji}  ${loadMessage}`)
            setTimeout(async () => {
              const result = this.client.randmizer.chooseWeighted([true, false], [50, 50])
              if (result === true) {
                const randSuccessMessage = this.client.randmizer.chooseWeighted(['축하합니다! :tada:', '축하해요!', ':tada:', ':smile:'], [60, 25, 14, 1])
                const data = await this.client.database.getGlobalUserData(message.member)
                this.client.database.updateGlobalUserData(message.member, { $set: { money: data.money * 2 } })
                safeEdit(BotMessage, `${message.member}\n${this.client._options.money.emoji}  올인 성공! 잔고가 2배로 설정되었어요! ${randSuccessMessage}`)
              } else {
                const randFailMessage = this.client.randmizer.chooseWeighted(['다음을 노려보세요!', '그럴수도 있지 뭐..', '아깝네요..', '괜찮아요..', 'ㄲㅂㄱㅂ...'], [60, 15, 10, 14, 1])
                safeEdit(BotMessage, `${message.member}\n${this.client._options.money.emoji}  올인 실패.. 잔고가 \`\`0\`\` 으로 설정되었어요.. ${randFailMessage}`)
                this.client.database.updateGlobalUserData(message.member, { $set: { money: 0 } })
              }
              message.author.isCasino = false
            }, 2500)
          })
          .catch((e) => {
            console.log(e.stack)
            message.reply(`${this.client._options.emojis.no}  시간이 초과되었어요.. \`\`${this.client._options.bot.prefix}올인\`\` 으로 다시 시도해 주세요!`)
            message.author.isCasino = false
          })
      } else {
        message.reply(`${this.client._options.emojis.no}  다른 도박 명령어의 사용을 마쳐주세요!`)
      }
    }
  }
}

module.exports = Command
