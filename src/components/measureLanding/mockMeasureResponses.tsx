import { MeasureScoring } from "../../models/MeasureScoring";
import { Model } from "../../models/Model";
import bulkCreate from "../createNewMeasure/bulkCreate";

const singleMeasure = [
  {
    id: "ab123",
    measureHumanReadableId: "ab123",
    measureSetId: null,
    version: 1.2,
    revisionNumber: 12,
    state: "NA",
    measureName: "TestMeasure1",
    cqlLibraryName: "TestLib1",
    measureScoring: MeasureScoring.COHORT,
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
  let visibleEments = oneHundredTenTestMeasures.slice(
    page + 1 * limit,
    page + 1 * limit + limit
  ).length;
  const data = {
    content: oneHundredTenTestMeasures.slice(page * limit, limit),
    totalPages: Math.ceil(100 / limit),
    totalElements: 100,
    numberOfElements: visibleEments,
    pageable: {
      offset: limit * page,
      pageSize: limit,
    },
  };

  return data;
};

export { oneItemResponse, mockPaginationResponses };
