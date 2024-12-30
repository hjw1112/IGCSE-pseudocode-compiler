function runCode() {
    const code = document.getElementById("code").value;
    const output = document.getElementById("output");
  
    try {
      const result = interpretPseudocode(code);
      output.textContent = result;
    } catch (error) {
      output.textContent = `Error: ${error.message}`;
    }
  }
  
  function interpretPseudocode(code) {
    const lines = code.split("\n").map(line => line.trim());
    const variables = {};
  
    let result = "";
    lines.forEach(line => {
      if (line.startsWith("DECLARE")) {
        const [_, varName] = line.match(/DECLARE (\w+)/);
        variables[varName] = null;
      } else if (line.includes("←")) {
        const [varName, value] = line.split("←").map(s => s.trim());
        variables[varName] = evalExpression(value, variables);
      } else if (line.startsWith("OUTPUT")) {
        const [_, value] = line.match(/OUTPUT (.+)/);
        result += evalExpression(value, variables) + "\n";
      }
    });
  
    return result.trim();
  }
  
  function evalExpression(expr, variables) {
    const keys = Object.keys(variables);
    const values = Object.values(variables);
  
    try {
      return new Function(...keys, `return ${expr};`)(...values);
    } catch {
      throw new Error(`Invalid expression: ${expr}`);
    }
  }
  