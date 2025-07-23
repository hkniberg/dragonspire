import { calculateTrioPlacement } from "@/lib/tilePlacementUtils";

describe('TilePlacementUtils', () => {
    describe('calculateTrioPlacement', () => {
        const cornerPosition = { row: 3, col: 5 };

        it('should place trio with rotation 0 (no rotation)', () => {
            const positions = calculateTrioPlacement(cornerPosition, 0);

            expect(positions).toEqual([
                { row: 3, col: 5 }, // corner
                { row: 3, col: 6 }, // right
                { row: 4, col: 5 }  // below
            ]);
        });

        it('should place trio with rotation 1 (90° clockwise)', () => {
            const positions = calculateTrioPlacement(cornerPosition, 1);

            expect(positions).toEqual([
                { row: 3, col: 5 }, // corner
                { row: 4, col: 5 }, // right (was below, now right)
                { row: 3, col: 4 }  // below (was right, now below)
            ]);
        });

        it('should place trio with rotation 2 (180° clockwise)', () => {
            const positions = calculateTrioPlacement(cornerPosition, 2);

            expect(positions).toEqual([
                { row: 3, col: 5 }, // corner
                { row: 3, col: 4 }, // right (opposite of original right)
                { row: 2, col: 5 }  // below (opposite of original below)
            ]);
        });

        it('should place trio with rotation 3 (270° clockwise)', () => {
            const positions = calculateTrioPlacement(cornerPosition, 3);

            expect(positions).toEqual([
                { row: 3, col: 5 }, // corner
                { row: 2, col: 5 }, // right (was below rotated 3 times)
                { row: 3, col: 6 }  // below (was right rotated 3 times)
            ]);
        });


    });
}); 