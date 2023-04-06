import { Model } from "@madie/madie-models";
import bulkCreate from "../components/__mocks__/bulkCreate";

const singleMeasure = [
  {
    id: "ab123",
    measureHumanReadableId: "ab123",
    measureSetId: null,
    version: "0.0.000",
    state: "NA",
    measureName: "TestMeasure1",
    cqlLibraryName: "TestLib1",
    cql: null,
    createdAt: null,
    createdBy: "TestUser1",
    lastModifiedAt: null,
    lastModifiedBy: "TestUser1",
    model: Model.QICORE,
    measureMetaData: null,
  },
];

const oneItemResponse = {
  content: singleMeasure,
  numberOfElements: 1,
  pageable: { offset: 0 },
};

const oneHundredTenTestMeasures = bulkCreate(110);

// number of elements left on page..
const mockPaginationResponses = (filterByCurrentUser, limit, page) => {
  return new Promise((resolve) => {
    let visibleEments = oneHundredTenTestMeasures.slice(
      page + 1 * limit,
      page + 1 * limit + limit
    ).length;
    const data = {
      content: oneHundredTenTestMeasures.slice(
        page * limit,
        page * limit + limit
      ),
      totalPages: Math.ceil(oneHundredTenTestMeasures.length / limit),
      totalElements: oneHundredTenTestMeasures.length,
      numberOfElements: visibleEments,
      pageable: {
        offset: limit * page,
        pageSize: limit,
      },
    };
    resolve(data);
  });
};

const TESTUSER1 = "TestUser1";
const multipleMeasures = [
  {
    id: "measureId1",
    measureName: "TestMeasure1",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    revisionNumber: "1",
    version: "1.000",
  },
  {
    id: "measureId2",
    measureName: "TestMeasure2",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "1.0.000",
  },
  {
    id: "measureId3",
    measureName: "TestMeasure3",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    revisionNumber: "3",
    version: "1.000",
  },
  {
    id: "measureId4",
    measureName: "TestMeasure4",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "1.0.000",
  },
  {
    id: "measureId5",
    measureName: "TestMeasure5",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    revisionNumber: "4",
    version: "1.000",
  },
  {
    id: "measureId6",
    measureName: "TestMeasure6",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "1.0.000",
  },
  {
    id: "measureId7",
    measureName: "TestMeasure7",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "2.0.000",
  },
  {
    id: "measureId8",
    measureName: "TestMeasure8",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "0.0.000",
  },
  {
    id: "measureId9",
    measureName: "TestMeasure9",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "0.0.000",
  },
  {
    id: "measureId10",
    measureName: "TestMeasure10",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "1.0.000",
  },
  {
    id: "measureId11",
    measureName: "TestMeasure11",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "1.0.000",
  },
  {
    id: "measureId12",
    measureName: "TestMeasure12",
    createdBy: TESTUSER1,
    model: Model.QICORE,
    version: "1.0.000",
  },
];

const multipleItemsResponse = {
  content: multipleMeasures,
  numberOfElements: 10,
  totalElements: 12,
  pageable: { offset: 0 },
};

export { oneItemResponse, multipleItemsResponse, mockPaginationResponses };
