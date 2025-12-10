/**
 * Test file for demonstrating inline edit functionality
 */

// Simple function without documentation
function add(a, b) {
  return a + b
}

// Function that could use better error handling
function divide(a, b) {
  return a / b
}

// Class without documentation
class Calculator {
  constructor() {
    this.history = []
  }

  calculate(operation, a, b) {
    let result
    switch (operation) {
      case "add":
        result = a + b
        break
      case "subtract":
        result = a - b
        break
      case "multiply":
        result = a * b
        break
      case "divide":
        result = a / b
        break
      default:
        throw new Error("Unknown operation")
    }
    this.history.push({ operation, a, b, result })
    return result
  }
}

export { add, divide, Calculator }
