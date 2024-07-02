import { beforeEach, describe, expect, it } from 'bun:test';
import { ChildNode } from './child-node.js';

class TestChildNode extends ChildNode<string> {
    protected assertEntryId(entryOrId: string): string {
        return entryOrId;
    }
}

describe('ChildNode', () => {
    let node: TestChildNode;

    beforeEach(() => {
        node = new TestChildNode();
    });

    describe('getParents', () => {
        it('should return empty array on unknown entry', () => {
            expect(node.getParents('a')).toEqual([]);
        });

        it('should return known parents', () => {
            node.setParents('a', ['b', 'c']);
            expect(node.getParents('a')).toEqual(['b', 'c']);
        });
    });

    describe('getParentsRecursive', () => {
        it('should load parents recursivly', () => {
            node.setParents('a', ['b', 'c']);
            node.setParents('b', ['d', 'e']);
            node.setParents('e', ['a']);

            expect(node.getParentsRecursive('a')).toEqual(['a', 'b', 'd', 'e', 'c']);
        });
    });
});
