'use client';

/**
 * CourseScratchPad - Temporary notepad for course notes
 * TODO: Implement full functionality
 */

interface CourseScratchPadProps {
  userId: string;
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  moduleTitle?: string;
}

export default function CourseScratchPad({
  userId,
  courseId,
  courseTitle,
  moduleId,
  moduleTitle,
}: CourseScratchPadProps) {
  // Stub component - functionality to be implemented
  return null;
}
