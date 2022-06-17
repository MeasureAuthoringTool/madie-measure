import { Model } from "@madie/madie-models";
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

export { oneItemResponse, mockPaginationResponses };
