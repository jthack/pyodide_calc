document.addEventListener('DOMContentLoaded', () => {
    const runeInputsContainer = document.getElementById('rune-inputs');
    const runeResultsContainer = document.getElementById('rune-results');
    const recipeListContainer = document.getElementById('recipe-list');
    const calculateButton = document.getElementById('calculate-button');
    const resetButton = document.getElementById('reset-button');

    // Define Rune Data (Name, Count needed for next upgrade, Gem needed - for display only)
    // Note: Count is null for Zod, and we use 3 or 2 based on recipes.
    const runes = [
        { name: "El", toNext: 3, gem: null },
        { name: "Eld", toNext: 3, gem: null },
        { name: "Tir", toNext: 3, gem: null },
        { name: "Nef", toNext: 3, gem: null },
        { name: "Eth", toNext: 3, gem: null },
        { name: "Ith", toNext: 3, gem: null },
        { name: "Tal", toNext: 3, gem: null },
        { name: "Ral", toNext: 3, gem: null },
        { name: "Ort", toNext: 3, gem: null },
        { name: "Thul", toNext: 3, gem: "Chipped Topaz" },
        { name: "Amn", toNext: 3, gem: "Chipped Amethyst" },
        { name: "Sol", toNext: 3, gem: "Chipped Sapphire" },
        { name: "Shael", toNext: 3, gem: "Chipped Ruby" },
        { name: "Dol", toNext: 3, gem: "Chipped Emerald" },
        { name: "Hel", toNext: 3, gem: "Chipped Diamond" },
        { name: "Io", toNext: 3, gem: "Flawed Topaz" },
        { name: "Lum", toNext: 3, gem: "Flawed Amethyst" },
        { name: "Ko", toNext: 3, gem: "Flawed Sapphire" },
        { name: "Fal", toNext: 3, gem: "Flawed Ruby" },
        { name: "Lem", toNext: 3, gem: "Flawed Emerald" },
        { name: "Pul", toNext: 2, gem: "Flawed Diamond" }, // Becomes 2:1 here
        { name: "Um", toNext: 2, gem: "Topaz" },
        { name: "Mal", toNext: 2, gem: "Amethyst" },
        { name: "Ist", toNext: 2, gem: "Sapphire" },
        { name: "Gul", toNext: 2, gem: "Ruby" },
        { name: "Vex", toNext: 2, gem: "Emerald" },
        { name: "Ohm", toNext: 2, gem: "Diamond" },
        { name: "Lo", toNext: 2, gem: "Flawless Topaz" },
        { name: "Sur", toNext: 2, gem: "Flawless Amethyst" },
        { name: "Ber", toNext: 2, gem: "Flawless Sapphire" },
        { name: "Jah", toNext: 2, gem: "Flawless Ruby" },
        { name: "Cham", toNext: 2, gem: "Flawless Emerald" },
        { name: "Zod", toNext: null, gem: null } // Highest rune
    ];

    // --- Generate UI Elements ---

    function generateUI() {
        runeInputsContainer.innerHTML = ''; // Clear previous
        runeResultsContainer.innerHTML = '';
        recipeListContainer.innerHTML = '';

        runes.forEach((rune, index) => {
            // Create Input Element
            const inputDiv = document.createElement('div');
            inputDiv.classList.add('rune-item');
            inputDiv.innerHTML = `
                <label for="rune-${rune.name.toLowerCase()}">${rune.name}</label>
                <input type="number" id="rune-${rune.name.toLowerCase()}" name="${rune.name}" min="0" value="0" step="1">
            `;
            runeInputsContainer.appendChild(inputDiv);

            // Create Result Display Element
            const resultDiv = document.createElement('div');
            resultDiv.classList.add('rune-item');
            resultDiv.innerHTML = `
                <div class="rune-name">${rune.name}</div>
                <div class="rune-result-count" id="result-${rune.name.toLowerCase()}">0</div>
            `;
            runeResultsContainer.appendChild(resultDiv);

            // Create Recipe List Item (if not Zod)
            if (rune.toNext !== null && index < runes.length - 1) {
                const nextRune = runes[index + 1];
                const li = document.createElement('li');
                let recipeText = `<span>${rune.toNext}</span> x ${rune.name}`;
                if (rune.gem) {
                    recipeText += ` + 1 ${rune.gem}`;
                }
                recipeText += ` → <span>1</span> x ${nextRune.name}`;
                li.innerHTML = recipeText;
                recipeListContainer.appendChild(li);
            }
        });
    }

    // --- Calculation Logic ---

    function calculateUpgrades() {
        // 1. Get current rune counts from inputs
        const currentCounts = {};
        runes.forEach(rune => {
            const inputElement = document.getElementById(`rune-${rune.name.toLowerCase()}`);
            currentCounts[rune.name] = parseInt(inputElement.value, 10) || 0; // Default to 0 if invalid/empty
        });

        // 2. Perform upgrades iteratively
        for (let i = 0; i < runes.length - 1; i++) { // Loop up to Cham (index length - 2)
            const currentRune = runes[i];
            const nextRune = runes[i + 1];
            const countNeeded = currentRune.toNext;

            if (countNeeded && currentCounts[currentRune.name] >= countNeeded) {
                const upgradesPossible = Math.floor(currentCounts[currentRune.name] / countNeeded);
                const runesRemaining = currentCounts[currentRune.name] % countNeeded;

                // Add upgraded runes to the next tier
                currentCounts[nextRune.name] += upgradesPossible;

                // Update current tier count to the remainder
                currentCounts[currentRune.name] = runesRemaining;
            }
        }

        // 3. Display results
        runes.forEach(rune => {
            const resultElement = document.getElementById(`result-${rune.name.toLowerCase()}`);
            resultElement.textContent = currentCounts[rune.name];
             // Optional: Highlight runes with > 0 count
            resultElement.closest('.rune-item').style.backgroundColor = currentCounts[rune.name] > 0 ? 'var(--secondary-color)' : 'var(--input-bg)';
        });
    }

    // --- Reset Logic ---
    function resetCalculator() {
         runes.forEach(rune => {
            // Reset input fields
            const inputElement = document.getElementById(`rune-${rune.name.toLowerCase()}`);
            inputElement.value = 0;

            // Reset result displays
            const resultElement = document.getElementById(`result-${rune.name.toLowerCase()}`);
            resultElement.textContent = 0;
             resultElement.closest('.rune-item').style.backgroundColor = 'var(--input-bg)'; // Reset background
        });
        console.log("Calculator Reset");
    }


    // --- Event Listeners ---
    calculateButton.addEventListener('click', calculateUpgrades);
    resetButton.addEventListener('click', resetCalculator);

    // --- Initial Setup ---
    generateUI();
    console.log("Rune Calculator Initialized");

}); // End DOMContentLoaded 