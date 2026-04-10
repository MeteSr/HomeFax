/**
 * TDD — OfflineBanner component
 */

import React from "react";
import { render, screen } from "@testing-library/react-native";
import OfflineBanner from "../../screens/OfflineBanner";

describe("OfflineBanner", () => {
  it("is visible when offline=true", () => {
    render(<OfflineBanner offline={true} />);
    expect(screen.getByText(/no internet connection|offline/i)).toBeTruthy();
  });

  it("renders nothing when offline=false", () => {
    const { toJSON } = render(<OfflineBanner offline={false} />);
    expect(toJSON()).toBeNull();
  });
});
