document.getElementById("runButton").addEventListener("click", () => {
  const codeInput = document.getElementById("codeInput").value;
  const outputElement = document.getElementById("output");

  try {
      const result = interpretPseudocode(codeInput);
      outputElement.textContent = result;
  } catch (error) {
      outputElement.textContent = `Error: ${error.message}`;
  }
});

function interpretPseudocode(code) {
  const lines = code.split("\n").map(line => line.trim());
  let variables = {};
  let procedures = {};
  let functions = {};
  let output = "";

  function parseExpression(expression, localScope = {}) {
      const scope = { ...variables, ...localScope };

      // Check for string literals and replace them
      if (expression.startsWith('"') && expression.endsWith('"')) {
          return expression.slice(1, -1); // Return string without quotes
      }

      // Replace variable names with their values
      const substituted = expression.replace(/[a-zA-Z_]\w*/g, match => {
          if (scope[match] !== undefined) {
              return scope[match];
          }
          throw new Error(`Unknown variable: ${match}`);
      });

      try {
          return eval(substituted); // Evaluate the expression after substitution
      } catch {
          throw new Error(`Invalid expression: ${expression}`);
      }
  }

  let currentProcedure = null;
  let currentFunction = null;
  let functionOrProcedureBody = [];
  let functionParams = [];
  let procedureParams = [];

  function executeProcedure(name, args) {
      const procedure = procedures[name];
      if (!procedure) throw new Error(`Unknown procedure: ${name}`);
      const localScope = {};
      procedure.params.forEach((param, index) => {
          localScope[param] = parseExpression(args[index]);
      });

      procedure.body.forEach(line => interpretLine(line, localScope));
  }

  function executeFunction(name, args) {
      const func = functions[name];
      if (!func) throw new Error(`Unknown function: ${name}`);
      const localScope = {};
      func.params.forEach((param, index) => {
          localScope[param] = parseExpression(args[index]);
      });

      for (let line of func.body) {
          if (line.startsWith("RETURN ")) {
              return parseExpression(line.replace("RETURN ", "").trim(), localScope);
          } else {
              interpretLine(line, localScope);
          }
      }

      throw new Error(`No RETURN statement in function ${name}`);
  }

  function interpretLine(line, localScope = {}) {
      if (currentProcedure || currentFunction) {
          if (line === "ENDPROCEDURE") {
              procedures[currentProcedure] = {
                  params: procedureParams.slice(),
                  body: functionOrProcedureBody.slice(),
              };
              currentProcedure = null;
              functionOrProcedureBody = [];
              procedureParams = [];
              return;
          } else if (line === "ENDFUNCTION") {
              functions[currentFunction] = {
                  params: functionParams.slice(),
                  body: functionOrProcedureBody.slice(),
              };
              currentFunction = null;
              functionOrProcedureBody = [];
              functionParams = [];
              return;
          }

          functionOrProcedureBody.push(line);
          return;
      }

      if (line.startsWith("DECLARE ")) {
          const variable = line.replace("DECLARE ", "").trim();
          variables[variable] = null;
      } else if (line.includes(" ← ") || line.includes(" = ")) {
          const [variable, expression] = line
              .split(/ ← | = /)
              .map(part => part.trim());
          variables[variable] = parseExpression(expression, localScope);
      } else if (line.startsWith("OUTPUT ")) {
          const value = parseExpression(line.replace("OUTPUT ", "").trim(), localScope);
          output += value + "\n";
      } else if (line.startsWith("PROCEDURE ")) {
          const parts = line.replace("PROCEDURE ", "").split("(");
          currentProcedure = parts[0].trim();
          procedureParams = parts[1].replace(")", "").split(",").map(param => param.trim());
      } else if (line.startsWith("FUNCTION ")) {
          const parts = line.replace("FUNCTION ", "").split("(");
          currentFunction = parts[0].trim();
          functionParams = parts[1].replace(")", "").split(",").map(param => param.trim());
      } else if (line.startsWith("CALL ")) {
          const callDetails = line.replace("CALL ", "").trim();
          const [name, argsRaw] = callDetails.split("(");
          const args = argsRaw.replace(")", "").split(",").map(arg => arg.trim());
          executeProcedure(name.trim(), args);
      } else if (line.includes("(") && line.includes(")")) {
          const [name, argsRaw] = line.split("(");
          const args = argsRaw.replace(")", "").split(",").map(arg => arg.trim());
          return executeFunction(name.trim(), args);
      } else if (line === "" || line === "ENDPROCEDURE" || line === "ENDFUNCTION") {
          // Skip empty lines or end markers handled earlier
      } else {
          throw new Error(`Unknown command: ${line}`);
      }
  }

  for (let line of lines) {
      interpretLine(line);
  }
  return output.trim() || "Program executed successfully.";
}
