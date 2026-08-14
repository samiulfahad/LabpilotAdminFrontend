import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import schemaService from "../../api/schemaService";
import testService from "../../api/testService";
import Popup from "../../components/popup/index";
import SearchAndSelect from "../../components/html/searchAndSelect";
import LoadingScreen from "../../components/loadingPage";
import Schema from "./Schema";

const SchemaEngine = () => {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({});
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState("");

  // Fetch tests
  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testService.getAll();
      setTests(response.data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
      setPopup({ type: "error", message: "Failed to load tests" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all schemas
  const fetchAllSchemas = async () => {
    try {
      setLoading(true);
      resetFilters();
      const response = await schemaService.getAll();
      setSchemas(response.data || []);
      if (response.data?.length === 0) {
        setPopup({ type: "error", message: "No schemas found" });
      }
    } catch (error) {
      console.error("Error fetching schemas:", error);
      setPopup({ type: "error", message: "Failed to load schemas" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch schema by test ID
  const fetchSchemaByTest = async (testId) => {
    try {
      setLoading(true);
      const response = await schemaService.getByTestId(testId);
      if (response.data) {
        setSchemas(response.data);
      } else {
        setSchemas([]);
        setPopup({ type: "error", message: "No schema found for selected test" });
      }
    } catch (error) {
      console.error("Error fetching schema:", error);
      setPopup({ type: "error", message: "Failed to load schema" });
    } finally {
      setLoading(false);
    }
  };

  // Handle schema deletion
  const handleDelete = async () => {
    try {
      setLoading(true);
      await schemaService.delete(popup._id);
      setSchemas((prev) => prev.filter((schema) => schema._id !== popup._id));
      setPopup({ type: "success", message: "Schema deleted successfully" });
    } catch (error) {
      console.error("Error deleting schema:", error);
      setPopup({ type: "error", message: error.response?.data?.message || "Failed to delete schema" });
    } finally {
      setLoading(false);
    }
  };

  // Handle setting a schema as its test's default
  const handleSetDefault = async () => {
    try {
      setLoading(true);
      const target = schemas.find((schema) => schema._id === popup._id);
      await schemaService.setDefault(popup._id);
      setSchemas((prev) =>
        prev.map((schema) =>
          schema.testId === target?.testId ? { ...schema, isDefault: schema._id === popup._id } : schema,
        ),
      );
      setPopup({ type: "success", message: "Default schema updated" });
    } catch (error) {
      console.error("Error setting default schema:", error);
      setPopup({ type: "error", message: error.response?.data?.message || "Failed to set default schema" });
    } finally {
      setLoading(false);
    }
  };

  // Handle test selection
  const handleTestChange = (e) => {
    setSelectedTest(e.target.value);
  };

  // Handle fetch action
  const handleFetch = () => {
    if (selectedTest) {
      fetchSchemaByTest(selectedTest);
    } else {
      setPopup({ type: "error", message: "Please select a test first" });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedTest("");
    setSchemas([]);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const testOptions = tests.map((test) => ({
    value: test._id,
    label: test.name || `Test ${test._id}`,
  }));

  const selectedTestName = tests.find((t) => t._id === selectedTest)?.name;

  return (
    <div className="min-h-screen bg-gray-50/30 py-2">
      {loading && <LoadingScreen />}
      {/* Popup for delete warning */}
      {popup.type === "warning" && popup.action === "delete" && (
        <Popup type={popup.type} message={popup.message} onClose={() => setPopup({})} onConfirm={handleDelete} />
      )}
      {/* Popup for set-default warning */}
      {popup.type === "warning" && popup.action === "setDefault" && (
        <Popup type={popup.type} message={popup.message} onClose={() => setPopup({})} onConfirm={handleSetDefault} />
      )}
      {/* Success/Error popup */}
      {(popup.type === "success" || popup.type === "error") && (
        <Popup type={popup.type} message={popup.message} onClose={() => setPopup({})} />
      )}
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Test Schemas</h1>
          </div>
          <Link
            to="/schema-builder"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Schema
          </Link>
        </div>
      </div>
      {/* Filters Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Test Dropdown */}
            <div className="md:col-span-6">
              <SearchAndSelect
                label="Test"
                name="test"
                value={selectedTest}
                onChange={handleTestChange}
                options={testOptions}
                placeholder="Select Test"
              />
            </div>
            {/* Fetch Button */}
            <div className="md:col-span-3">
              <button
                onClick={handleFetch}
                disabled={!selectedTest}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Fetch
              </button>
            </div>
            {/* View All Button */}
            <div className="md:col-span-3">
              <button
                onClick={fetchAllSchemas}
                className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View All
              </button>
            </div>
          </div>
          {/* Active Filters */}
          {selectedTest && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">{selectedTestName}</span>
              </div>
              <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {schemas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {selectedTest
                ? "No schemas match your current selection."
                : "Select a test and click Fetch to view its schemas or click View All."}
            </p>
          </div>
        ) : (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Schemas</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {schemas.length} schema{schemas.length !== 1 ? "s" : ""} found
                  {selectedTest && ` • Filtered by ${selectedTestName}`}
                </p>
              </div>
              {selectedTest && (
                <button onClick={resetFilters} className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                  Clear filters
                </button>
              )}
            </div>
            {/* Schemas Grid */}
            <div className="space-y-4">
              {schemas.map((schema, index) => (
                <Schema
                  key={schema._id}
                  input={schema}
                  index={index}
                  onDelete={() =>
                    setPopup({
                      type: "warning",
                      message: "Do you want to delete this schema?",
                      _id: schema._id,
                      action: "delete",
                    })
                  }
                  onSetDefault={() =>
                    setPopup({
                      type: "warning",
                      message: "Set this schema as the default for its test?",
                      _id: schema._id,
                      action: "setDefault",
                    })
                  }
                  onRenderForm={() => {
                    console.log("Render form for schema:", schema._id);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaEngine;
