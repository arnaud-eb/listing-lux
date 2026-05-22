import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BuildingDetails from "./BuildingDetails";
import type { Property } from "@/lib/types";

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "prop-1",
    bedrooms: 2,
    bathrooms: 1,
    sqm: 90,
    price: 750000,
    neighborhood: "kirchberg",
    property_type: "apartment",
    features: {},
    photo_urls: [],
    address: null,
    created_at: "2026-01-01T00:00:00Z",
    listing_kind: "sale",
    ...overrides,
  };
}

describe("BuildingDetails", () => {
  it("renders nothing when no building fields are set", () => {
    const { container } = render(
      <BuildingDetails property={makeProperty()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the fields that are present", () => {
    render(
      <BuildingDetails
        property={makeProperty({
          year_built: 1998,
          cpe_class: "C",
          charges_monthly: 250,
        })}
      />,
    );
    expect(screen.getByText("Year built")).toBeInTheDocument();
    expect(screen.getByText("1998")).toBeInTheDocument();
    expect(screen.getByText("Energy class")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("Monthly charges")).toBeInTheDocument();
    expect(screen.queryByText("Floors in building")).not.toBeInTheDocument();
  });

  it("labels floor 0 as the ground floor", () => {
    render(<BuildingDetails property={makeProperty({ floor_of_unit: 0 })} />);
    expect(screen.getByText("Ground floor")).toBeInTheDocument();
  });

  it("shows the availability date only for rentals", () => {
    render(
      <BuildingDetails
        property={makeProperty({
          listing_kind: "sale",
          availability_date: "2026-09-01",
        })}
      />,
    );
    expect(screen.queryByText("Available from")).not.toBeInTheDocument();

    render(
      <BuildingDetails
        property={makeProperty({
          listing_kind: "rent",
          availability_date: "2026-09-01",
        })}
      />,
    );
    expect(screen.getByText("Available from")).toBeInTheDocument();
  });
});
