import {
  getCropFrameOffsetPercentage,
  getObjectPositionPercentage,
} from "./authImageCrop";

describe("auth image crop math", () => {
  it("maps object-position to the left edge of the crop frame", () => {
    expect(getCropFrameOffsetPercentage(0, 60)).toBe(0);
    expect(getCropFrameOffsetPercentage(50, 60)).toBe(20);
    expect(getCropFrameOffsetPercentage(100, 60)).toBe(40);
  });

  it("maps crop frame offsets back to object-position", () => {
    expect(getObjectPositionPercentage(0, 60)).toBe(0);
    expect(getObjectPositionPercentage(20, 60)).toBe(50);
    expect(getObjectPositionPercentage(40, 60)).toBe(100);
  });

  it("falls back safely when the image already matches the preview ratio", () => {
    expect(getCropFrameOffsetPercentage(75, 100)).toBe(0);
    expect(getObjectPositionPercentage(0, 100)).toBe(50);
  });
});
