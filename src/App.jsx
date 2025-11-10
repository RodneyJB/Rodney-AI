import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import { AttentionBox, Button, Dropdown, TextField, TextArea, Box, Flex, Heading, Text } from "@vibe/core";

const monday = mondaySdk();

const App = () => {
  const [context, setContext] = useState();
  const [itemData, setItemData] = useState(null);
  const [boardColumns, setBoardColumns] = useState([]);
  const [actionType, setActionType] = useState("rename");
  const [formula, setFormula] = useState("{Status} - {Name}");
  const [targetColumn, setTargetColumn] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    monday.execute("valueCreatedForUser");

    // Listen for context changes
    monday.listen("context", (res) => {
      setContext(res.data);
      if (res.data.itemId && res.data.boardId) {
        fetchItemData(res.data.boardId, res.data.itemId);
        fetchBoardColumns(res.data.boardId);
      }
    });
  }, []);

  // Fetch item data
  const fetchItemData = async (boardId, itemId) => {
    try {
      const query = `query {
        items(ids: [${itemId}]) {
          id
          name
          column_values {
            id
            title
            text
            value
          }
        }
      }`;
      
      const response = await monday.api(query);
      if (response.data?.items?.[0]) {
        setItemData(response.data.items[0]);
      }
    } catch (error) {
      console.error("Error fetching item data:", error);
    }
  };

  // Fetch board columns
  const fetchBoardColumns = async (boardId) => {
    try {
      const query = `query {
        boards(ids: [${boardId}]) {
          columns {
            id
            title
            type
          }
        }
      }`;
      
      const response = await monday.api(query);
      if (response.data?.boards?.[0]?.columns) {
        setBoardColumns(response.data.boards[0].columns);
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
    }
  };

  // Formula evaluation engine
  const evaluateFormula = (formulaStr) => {
    if (!itemData) return formulaStr;

    let result = formulaStr;

    // Replace column references with actual values
    const columnMatches = formulaStr.match(/\{([^}]+)\}/g);
    
    if (columnMatches) {
      columnMatches.forEach(match => {
        const columnName = match.slice(1, -1); // Remove { }
        
        // Find column by title
        const column = itemData.column_values.find(col => 
          col.title.toLowerCase() === columnName.toLowerCase()
        );
        
        if (column) {
          const value = column.text || column.value || '';
          result = result.replace(match, value);
        }
      });
    }

    // Handle date formatting: {Date|format:YYYY-MM-DD}
    result = result.replace(/\{Date\|format:([^}]+)\}/g, (match, format) => {
      const date = new Date();
      return formatDate(date, format);
    });

    return result.trim();
  };

  // Date formatting helper
  const formatDate = (date, format) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  };

  // Execute action
  const executeAction = async () => {
    if (!context || !itemData) return;

    setProcessing(true);
    setResult(null);

    try {
      const evaluatedValue = evaluateFormula(formula);

      let mutation = "";
      let successMessage = "";

      switch (actionType) {
        case "rename":
          mutation = `mutation {
            change_simple_column_value(
              item_id: ${context.itemId},
              board_id: ${context.boardId},
              column_id: "name",
              value: "${evaluatedValue}"
            ) {
              id
            }
          }`;
          successMessage = `Item renamed to: ${evaluatedValue}`;
          break;

        case "update_column":
          if (!targetColumn) {
            setResult({ success: false, message: "Please select a target column" });
            setProcessing(false);
            return;
          }
          mutation = `mutation {
            change_simple_column_value(
              item_id: ${context.itemId},
              board_id: ${context.boardId},
              column_id: "${targetColumn}",
              value: "${evaluatedValue}"
            ) {
              id
            }
          }`;
          successMessage = `Column updated with: ${evaluatedValue}`;
          break;

        case "duplicate":
          mutation = `mutation {
            duplicate_item(
              item_id: ${context.itemId},
              board_id: ${context.boardId}
            ) {
              id
            }
          }`;
          successMessage = "Item duplicated successfully!";
          break;

        case "create_subitems":
          const subitemNames = evaluatedValue.split(',').map(name => name.trim());
          // Create subitems one by one
          for (const name of subitemNames) {
            const subitemMutation = `mutation {
              create_subitem(
                parent_item_id: ${context.itemId},
                item_name: "${name}"
              ) {
                id
              }
            }`;
            await monday.api(subitemMutation);
          }
          successMessage = `Created ${subitemNames.length} subitems!`;
          setResult({ success: true, message: successMessage });
          setProcessing(false);
          return;
      }

      if (mutation) {
        await monday.api(mutation);
        setResult({ success: true, message: successMessage });
      }

    } catch (error) {
      console.error("Error executing action:", error);
      setResult({ success: false, message: `Error: ${error.message}` });
    }

    setProcessing(false);
  };

  const actionOptions = [
    { value: "rename", label: "Rename Item" },
    { value: "update_column", label: "Update Column Value" },
    { value: "duplicate", label: "Duplicate Item" },
    { value: "create_subitems", label: "Create Subitems" }
  ];

  const columnOptions = boardColumns.map(col => ({
    value: col.id,
    label: col.title
  }));

  return (
    <div className="App">
      <Box padding={Box.paddings.LARGE}>
        <Heading type={Heading.types.h1} value="🤖 Rodney AI" />
        <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
          Advanced automation with formula support
        </Text>

        {!itemData ? (
          <AttentionBox
            title="Loading item data..."
            text="Please wait while we fetch the item information."
            type="loading"
          />
        ) : (
          <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.LARGE} style={{ marginTop: '20px' }}>
            
            <Box>
              <Text weight={Text.weights.BOLD}>Current Item: {itemData.name}</Text>
            </Box>

            <Box>
              <Text weight={Text.weights.BOLD} style={{ marginBottom: '8px' }}>Action Type</Text>
              <Dropdown
                placeholder="Select action"
                options={actionOptions}
                value={actionType}
                onChange={(option) => setActionType(option.value)}
              />
            </Box>

            <Box>
              <Text weight={Text.weights.BOLD} style={{ marginBottom: '8px' }}>Formula</Text>
              <TextArea
                placeholder="Enter formula using {ColumnName} syntax"
                value={formula}
                onChange={(value) => setFormula(value)}
                rows={3}
              />
              <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY} style={{ marginTop: '4px' }}>
                Example: {"{Status}"} - {"{Name}"} - {"{Date|format:YYYY-MM-DD}"}
              </Text>
            </Box>

            {actionType === "update_column" && (
              <Box>
                <Text weight={Text.weights.BOLD} style={{ marginBottom: '8px' }}>Target Column</Text>
                <Dropdown
                  placeholder="Select column to update"
                  options={columnOptions}
                  value={targetColumn}
                  onChange={(option) => setTargetColumn(option.value)}
                />
              </Box>
            )}

            <Box>
              <Text weight={Text.weights.BOLD} style={{ marginBottom: '8px' }}>Preview</Text>
              <Box style={{ 
                padding: '12px', 
                background: '#f6f7fb', 
                borderRadius: '4px',
                border: '1px solid #d0d4e4'
              }}>
                <Text>{evaluateFormula(formula)}</Text>
              </Box>
            </Box>

            <Button
              onClick={executeAction}
              loading={processing}
              disabled={processing || !itemData}
            >
              Execute Action
            </Button>

            {result && (
              <AttentionBox
                title={result.success ? "Success!" : "Error"}
                text={result.message}
                type={result.success ? "success" : "danger"}
              />
            )}

            <Box style={{ marginTop: '20px', padding: '15px', background: '#e6f4ff', borderRadius: '4px' }}>
              <Text weight={Text.weights.BOLD}>Available Columns:</Text>
              <Box style={{ marginTop: '8px' }}>
                {itemData.column_values.map(col => (
                  <Text key={col.id} type={Text.types.TEXT2} style={{ display: 'block' }}>
                    • {"{" + col.title + "}"} = {col.text || '(empty)'}
                  </Text>
                ))}
              </Box>
            </Box>

          </Flex>
        )}
      </Box>
    </div>
  );
};

export default App;
