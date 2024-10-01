import { applyLibrary, deleteIncludedLibrary, editLibrary } from "./libraryApplier";
import IncludedLibrary from "@madie/madie-models/dist/IncludedLibrary";
import { IncludeLibrary } from "@madie/madie-editor";

describe("Library Apply Utility tests", () => {
  it("Should apply Library successfully if there are existing includes", () => {
    const cql =
      "library CaseWhenThen version '0.3.000'\n" +
      "using QDM version '5.6'\n" +
      "include CancerLinQ version '1.5.000' called CancerLinQQ\n" +
      "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'";
    const library = {
      name: "TestHelpers",
      alias: "Helpers",
      version: "1.1.000",
    } as IncludeLibrary;
    const result = applyLibrary(cql, library);
    expect(result.message).toEqual(
      `Library ${library.name} has been successfully added to the CQL.`
    );
    expect(result.cql).toEqual(
      "library CaseWhenThen version '0.3.000'\n" +
        "using QDM version '5.6'\n" +
        "include CancerLinQ version '1.5.000' called CancerLinQQ\n" +
        "include TestHelpers version '1.1.000' called Helpers\n" +
        "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'"
    );
  });

  it("Should apply Library successfully if there are no existing includes", () => {
    const cql =
      "library CaseWhenThen version '0.3.000'\n" +
      "using QDM version '5.6'\n" +
      "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'";
    const library = {
      name: "TestHelpers",
      alias: "Helpers",
      version: "1.1.000",
    } as IncludedLibrary;
    const result = applyLibrary(cql, library);
    expect(result.message).toEqual(
      `Library ${library.name} has been successfully added to the CQL.`
    );
    expect(result.cql).toEqual(
      "library CaseWhenThen version '0.3.000'\n" +
        "using QDM version '5.6'\n" +
        "include TestHelpers version '1.1.000' called Helpers\n" +
        "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'"
    );
  });

  it("Should apply Library successfully if there is no includes & using", () => {
    const cql =
      "library CaseWhenThen version '0.3.000'\n" +
      "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'";
    const library = {
      name: "TestHelpers",
      alias: "Helpers",
      version: "1.1.000",
    } as IncludeLibrary;
    const result = applyLibrary(cql, library);
    expect(result.message).toEqual(
      `Library ${library.name} has been successfully added to the CQL.`
    );
    expect(result.cql).toEqual(
      "library CaseWhenThen version '0.3.000'\n" +
        "include TestHelpers version '1.1.000' called Helpers\n" +
        "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'"
    );
  });

  it("Should apply Library successfully if cql is blank", () => {
    const cql = "";
    const library = {
      name: "TestHelpers",
      alias: "Helpers",
      version: "1.1.000",
    } as IncludeLibrary;
    const result = applyLibrary(cql, library);
    expect(result.message).toEqual(
      `Library ${library.name} has been successfully added to the CQL.`
    );
    expect(result.cql).toEqual(
      "include TestHelpers version '1.1.000' called Helpers"
    );
  });

  it("Should not apply Library if library name already included", () => {
    const cql =
      "library CaseWhenThen version '0.3.000'\n" +
      "using QDM version '5.6'\n" +
      "include CancerLinQ version '1.5.000' called CancerLinQQ\n";
    const library = {
      name: "CancerLinQ",
      alias: "Test",
      version: "1.2.000",
    } as IncludeLibrary;
    const result = applyLibrary(cql, library);
    expect(result.message).toEqual(
      `Library ${library.name} has already been defined in the CQL.`
    );
    // cql unchanged
    expect(result.cql).toEqual(cql);
  });

  it("Should not apply Library if alias already present in CQL", () => {
    const cql =
      "library CaseWhenThen version '0.3.000'\n" +
      "using QDM version '5.6'\n" +
      "include CancerLinQ version '1.5.000' called CancerLinQQ\n";
    const library = {
      name: "Test",
      alias: "CancerLinQQ",
      version: "1.2.000",
    } as IncludeLibrary;
    const result = applyLibrary(cql, library);
    expect(result.message).toEqual(
      `Alias ${library.alias} has already been defined in the CQL.`
    );
    // cql unchanged
    expect(result.cql).toEqual(cql);
  });

  it("should remove included library", () => {
    const include = "include CancerLinQ version '1.5.000' called CancerLinQQ\n";
    const cqlWithNoInclude =
      "library CaseWhenThen version '0.3.000'\nusing QDM version '5.6'\n";
    const cqlWithInclude = cqlWithNoInclude + include;
    const library = {
      name: "CancerLinQ",
      alias: "CancerLinQQ",
      version: "1.5.000",
    } as IncludeLibrary;
    const result = deleteIncludedLibrary(cqlWithInclude, library);
    expect(result).toEqual(cqlWithNoInclude);
  });

  it("should not remove included library if one does not exist", () => {
    const cql =
      "library CaseWhenThen version '0.3.000'\nusing QDM version '5.6'\n" +
      "include CancerLinQ version '1.5.000' called CancerLinQQ\n";
    const library = {
      name: "UnknownLibrary",
      alias: "Unknown",
      version: "1.5.000",
    } as IncludeLibrary;
    const result = deleteIncludedLibrary(cql, library);
    // cql unchanged
    expect(result).toEqual(cql);
  });

  it("Should edit the existing Library successfully with new library", () => {
    const cql =
      "library CaseWhenThen version '0.3.000'\n" +
      "using QDM version '5.6'\n" +
      "include CancerLinQ version '1.5.000' called CancerLinQQ\n" +
      "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'";
    
    const editedLibrary = {
      name:'CancerLinQ',
      version:'1.5.000',
      alias: 'EditedCancerLinQQ'
    }

    const selectedLibrary = {
      name:'CancerLinQ',
      version:'1.5.000',
      alias: 'CancerLinQQ'
    }

    const result= editLibrary(selectedLibrary, editedLibrary,cql) 
    expect(result).toEqual("library CaseWhenThen version '0.3.000'\n" +
      "using QDM version '5.6'\n" +
      "include CancerLinQ version '1.5.000' called EditedCancerLinQQ\n" +
      "codesystem \"RXNORM\": 'urn:oid:2.16.840.1.113883.6.88'");
  })
});
