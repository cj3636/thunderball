const fs = require('fs');

const csvPath = 'c:/wamp64/thunderball/thunderball_state_day19_migrated.csv';
const outputPath = 'c:/wamp64/thunderball/thunderball_state_day19_shuffled.json';

const csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.split('\n').slice(1); // remove header

const prizes = lines.map(line => {
    const [number, prize, isSpecial, isClaimed, basePrize, accrualDays] = line.split(',');
    if (!number) return null;
    return {
        number: parseInt(number),
        basePrize: parseInt(basePrize),
        isSpecial: isSpecial === '1',
        isClaimed: isClaimed === '1',
        claimDay: null,
        accrualDays: parseInt(accrualDays) || 0
    };
}).filter(p => p);

const prizeData = prizes.map(p => ({
    basePrize: p.basePrize,
    isSpecial: p.isSpecial,
    accrualDays: p.accrualDays
}));

// Fisher-Yates shuffle
for (let i = prizeData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [prizeData[i], prizeData[j]] = [prizeData[j], prizeData[i]];
}

const newPrizes = [];
prizes.sort((a, b) => a.number - b.number).forEach((originalPrize, index) => {
    const newPrize = { ...originalPrize };
    const shuffledData = prizeData[index];
    
    newPrize.basePrize = shuffledData.basePrize;
    newPrize.isSpecial = shuffledData.isSpecial;
    newPrize.accrualDays = shuffledData.accrualDays;
    newPrize.isClaimed = false;
    newPrize.claimDay = null;
    newPrizes.push(newPrize);
});

const newState = {
    day: 19,
    specialIncrement: 25,
    prizes: newPrizes,
    shuffleSettings: {
        shuffleSpecials: true,
        shuffleRegulars: true
    }
};

fs.writeFileSync(outputPath, JSON.stringify(newState, null, 2));

console.log('Shuffled state saved to', outputPath);
