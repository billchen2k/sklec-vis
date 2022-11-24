import {IDatasetTag} from '@/types';

export class TagNode {
  public tag?: IDatasetTag;
  public parent?: TagNode;
  public children: TagNode[];
  constructor(tag?: IDatasetTag) {
    this.tag = tag;
    this.parent = null;
    this.children = [];
  }
}

export default class TagStore {
  private tags: IDatasetTag[]; // Tags with their parent tree

  private tagTree: TagNode;
  private uuid2NodeTable: Record<string, TagNode>;

  constructor(tags: IDatasetTag[]) {
    this.tags = tags;
    this.loadTree();
  }

  private loadTree() {
    this.tagTree = new TagNode();
    this.uuid2NodeTable = {};
    for (const tag of this.tags) {
      this.uuid2NodeTable[tag.uuid] = new TagNode(tag);
    }
    for (const tag of this.tags) {
      if (tag.parent) {
        const parentId: string = tag.parent as string;
        this.uuid2NodeTable[parentId].children.push(this.uuid2NodeTable[tag.uuid]);
        this.uuid2NodeTable[tag.uuid].parent = this.uuid2NodeTable[parentId];
      } else {
        this.tagTree.children.push(this.uuid2NodeTable[tag.uuid]);
        this.uuid2NodeTable[tag.uuid].parent = this.tagTree;
      }
    }
    this.calcTagLevel(this.tagTree, -1);
    console.log(this.tagTree);
  }

  private calcTagLevel(root: TagNode, level: number) {
    if (root.tag) {
      root.tag.level = level;
    }
    for (const child of root.children) {
      this.calcTagLevel(child, level + 1);
    }
  }

  public tagFullName(uuid: string): string {
    let tagNode = this.uuid2NodeTable[uuid];
    if (!tagNode) {
      console.warn(`Tag ${uuid} doesn't exist.`);
      return '';
    }
    const names = [];
    while (tagNode.tag) {
      names.push(tagNode.tag?.full_name);
      tagNode = tagNode.parent;
    }
    names.reverse();
    return names.join(' / ');
  }

  /**
   *
   * @param uuid UUID of the tag
   * @return The IDatasetTag objects. Returns the up most level of the tag.
   */
  public getParentTag(uuid: string): IDatasetTag {
    let tagNode = this.uuid2NodeTable[uuid];
    if (!tagNode) {
      console.warn(`Tag ${uuid} doesn't exist.`);
      return null;
    }
    while (tagNode.parent?.tag) {
      tagNode = tagNode.parent;
    }
    return tagNode.tag;
  }

  public getChildTags(uuid: string): IDatasetTag[] {
    const tagNode = this.uuid2NodeTable[uuid];
    if (!tagNode) {
      console.warn(`Tag ${uuid} doesn't exist.`);
      return null;
    }
    return tagNode.children.map((one) => one.tag);
  }

  public setTags(tags: IDatasetTag[]): void {
    this.tags = tags;
    this.loadTree();
  }

  public getAllTags(): IDatasetTag[] {
    const res: IDatasetTag[] = [];
    this._getAllTags(this.tagTree, res);
    return res;
  }

  public getTag(uuid: string): IDatasetTag {
    return this.uuid2NodeTable[uuid]?.tag || null;
  }

  private _getAllTags(root: TagNode, current: IDatasetTag[]) {
    if (root.tag) {
      current.push(root.tag);
    }
    for (const child of root.children) {
      this._getAllTags(child, current);
    }
  }
}
