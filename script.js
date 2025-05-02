const display = document.getElementById('display');
const loadingStatus = document.getElementById('loading-status');
const errorMessage = document.getElementById('error-message');
const equalsButton = document.getElementById('equals');

let currentInput = '0';
let operator = null;
let firstOperand = null;
let waitingForSecondOperand = false;
let pyodide = null;

// --- Pyodide Initialization ---

async function initializePyodide() {
    try {
        console.log("Loading Pyodide...");
        display.innerText = "Loading...";
        pyodide = await loadPyodide();
        console.log("Pyodide loaded.");

        // Define the Python calculation function once
        await pyodide.runPythonAsync(`
            import sys
            def calculate(a, b, op):
                try:
                    num1 = float(a)
                    num2 = float(b)
                    if op == '+':
                        return num1 + num2
                    elif op == '-':
                        return num1 - num2
                    elif op == '*':
                        return num1 * num2
                    elif op == '/':
                        if num2 == 0:
                            return "Error: Div by 0"
                        return num1 / num2
                    else:
                        return "Error: Invalid op"
                except Exception as e:
                    # Capture any unexpected Python errors
                    print(f"Python Error: {e}", file=sys.stderr)
                    return f"Error: {e}"
        `);
        console.log("Python 'calculate' function defined.");

        loadingStatus.style.display = 'none'; // Hide loading message
        equalsButton.disabled = false; // Enable equals button
        updateDisplay(); // Show initial '0'
        console.log("Calculator ready.");

    } catch (error) {
        console.error("Pyodide loading failed:", error);
        loadingStatus.innerText = "Pyodide failed to load.";
        errorMessage.innerText = `Error loading Pyodide: ${error.message}`;
        errorMessage.style.display = 'block';
        // Disable calculator functionality if Pyodide fails
        document.querySelectorAll('.buttons button').forEach(btn => btn.disabled = true);
    }
}

// Disable equals button until Pyodide is ready
equalsButton.disabled = true;
initializePyodide();

// --- Calculator Logic ---

function updateDisplay() {
    display.innerText = currentInput;
    // Hide error message when display updates successfully
    errorMessage.style.display = 'none';
}

function clearDisplay() {
    currentInput = '0';
    operator = null;
    firstOperand = null;
    waitingForSecondOperand = false;
    updateDisplay();
    console.log("Calculator cleared");
}

function appendNumber(number) {
    if (waitingForSecondOperand) {
        currentInput = number;
        waitingForSecondOperand = false;
    } else {
        // Prevent multiple leading zeros unless it's just "0."
        if (currentInput === '0' && number !== '.') currentInput = '';
        // Prevent multiple decimal points
        if (number === '.' && currentInput.includes('.')) return;
        currentInput += number;
    }
    updateDisplay();
}

function appendOperator(op) {
    // If an operator is already pending, calculate the intermediate result first
    if (operator && !waitingForSecondOperand) {
         calculateResultInternal(); // Calculate but don't reset operator fully yet
    }

    // Check if currentInput is a valid number before proceeding
    const inputValue = parseFloat(currentInput);
    if (isNaN(inputValue)) {
        showError("Invalid input before operator");
        return;
    }


    firstOperand = currentInput;
    operator = op;
    waitingForSecondOperand = true;
    console.log(`Operator set: ${op}, First operand: ${firstOperand}`);
}

async function calculateResult() {
    if (!pyodide) {
        showError("Pyodide not loaded yet!");
        return;
    }
    if (operator === null || waitingForSecondOperand) {
        // Nothing to calculate if no operator or second operand hasn't been entered
        console.log("Calculation skipped: No operator or waiting for second operand.");
        return;
    }

    const secondOperand = currentInput;
    console.log(`Calculating: ${firstOperand} ${operator} ${secondOperand}`);

    try {
        // Access the Python function we defined during initialization
        let calculate_py = pyodide.globals.get('calculate');
        // Pass operands as strings to Python, let Python handle float conversion
        let result = await calculate_py(firstOperand, secondOperand, operator);

        // Check if Python returned an error string
        if (typeof result === 'string' && result.startsWith("Error:")) {
            showError(result);
            // Optionally clear state on error, or allow user to correct
            // clearDisplay(); // Uncomment to reset on error
        } else {
             // Convert result back to string for display, handle potential precision issues
             currentInput = String(parseFloat(result.toPrecision(12))); // Limit precision
             updateDisplay();
             console.log("Result:", currentInput);
        }
        calculate_py.destroy(); // Clean up Pyodide proxy if needed

    } catch (error) {
        console.error("Error during Pyodide calculation:", error);
        showError(`JS Error: ${error.message}`);
    }

    // Reset for the next calculation
    operator = null;
    firstOperand = null; // Keep result in currentInput for potential chaining
    waitingForSecondOperand = false; // Ready for new number input
}

// Internal calculation used for chaining operators (e.g., 5 + 3 * 2)
// This performs the *previous* operation when a new operator is pressed.
// Note: This implements simple left-to-right evaluation, not order of operations (PEMDAS).
async function calculateResultInternal() {
     if (!pyodide || operator === null || firstOperand === null) return;

     const secondOperand = currentInput;
     console.log(`Internal Calc: ${firstOperand} ${operator} ${secondOperand}`);

     try {
        let calculate_py = pyodide.globals.get('calculate');
        let result = await calculate_py(firstOperand, secondOperand, operator);

        if (typeof result === 'string' && result.startsWith("Error:")) {
             showError(result);
             // Reset state on internal error to prevent further issues
             clearDisplay();
        } else {
             currentInput = String(parseFloat(result.toPrecision(12)));
             updateDisplay(); // Show intermediate result
             // The new operator will be set by appendOperator function right after this
        }
        calculate_py.destroy();

     } catch (error) {
         console.error("Internal Pyodide calc error:", error);
         showError(`JS Error: ${error.message}`);
         clearDisplay(); // Reset on error
     }
     // Don't reset operator/firstOperand here, appendOperator will handle the next step
}

function showError(message) {
    errorMessage.innerText = message;
    errorMessage.style.display = 'block';
    console.error("Calculator Error:", message);
} 