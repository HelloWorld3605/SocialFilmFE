const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const clampPercentage = (value: number) => clamp(value, 0, 100);

export const getCropFrameOffsetPercentage = (
  objectPositionPercentage: number,
  frameSizePercentage: number,
) => {
  const normalizedFrameSize = clampPercentage(frameSizePercentage);

  if (normalizedFrameSize >= 99.999) {
    return 0;
  }

  return (
    (clampPercentage(objectPositionPercentage) *
      (100 - normalizedFrameSize)) /
    100
  );
};

export const getObjectPositionPercentage = (
  frameOffsetPercentage: number,
  frameSizePercentage: number,
) => {
  const normalizedFrameSize = clampPercentage(frameSizePercentage);

  if (normalizedFrameSize >= 99.999) {
    return 50;
  }

  const maxOffset = 100 - normalizedFrameSize;
  return (clamp(frameOffsetPercentage, 0, maxOffset) / maxOffset) * 100;
};
