import { Entity, Field, Fields, InMemoryDataProvider, Remult, ValueListFieldType } from "../core";

@ValueListFieldType()
class status {
  static ok = new status()
  static notOk = new status()
  id!: string;
}

@Entity("categories")
class Category {
  @Fields.autoIncrement()
  id = 0;
  @Fields.string()
  name = '';
}

@Entity("tasks")
class Task {
  @Fields.autoIncrement()
  id = 0;
  @Fields.string()
  title = '';
  @Fields.dateOnly()
  dateOnly = new Date(2016, 6, 6, 5)
  @Fields.date()
  date = new Date(2016, 6, 6, 5)
  @Fields.string({ includeInApi: false })
  shouldNotSee = '';
  @Field(() => status)
  status = status.ok;
  @Field(() => Category)
  category?: Category;
}


describe("Test sync from and to json", () => {
  const remult = new Remult(new InMemoryDataProvider())
  const category: Category = {
    id: 1,
    name: "testCat"
  };
  const task1: Task = {
    id: 1,
    title: "test",
    date: new Date("2020-07-03T01:00:00.000Z"),
    dateOnly: new Date("2020-07-03T01:00:00.000Z"),
    shouldNotSee: 'secret',
    status: status.notOk,
    category: category
  }
  const task2: Task = {
    id: 2,
    title: "test2",
    date: new Date("2022-07-03T01:00:00.000Z"),
    dateOnly: new Date("2022-07-03T01:00:00.000Z"),
    shouldNotSee: 'secret',
    status: status.ok,
    category: category
  }
  const repo = remult.repo(Task)

  it("test that it works", () => {
    let theJson = repo.toJson(task1);

    let forTest = { ...theJson }
    delete forTest.date;
    expect(forTest).toMatchInlineSnapshot(
      `
      {
        "category": {
          "id": 1,
          "name": "testCat",
        },
        "dateOnly": "2020-07-03",
        "id": 1,
        "status": "notOk",
        "title": "test",
      }
    `)
    let t = repo.fromJson(theJson);
    expect(t.date.getFullYear()).toBe(2020);
    expect(t.dateOnly.getFullYear()).toBe(2020);
    delete t.date
    delete t.dateOnly
    expect(t).toMatchInlineSnapshot(
      `
      Task {
        "category": Category {
          "id": 1,
          "name": "testCat",
        },
        "id": 1,
        "shouldNotSee": "",
        "status": status {
          "caption": "Not Ok",
          "id": "notOk",
        },
        "title": "test",
      }
    `);
  })
  it("test category", () => {
    const t = { ...task1 };
    const ref = repo.getEntityRef(t);
    expect(ref.fields.category.value?.name).toBe("testCat")
  })
  it("test with null category", () => {
    const t = { ...task1, category: null };
    const r = repo.fromJson(repo.toJson(t))
    delete r.date
    delete r.dateOnly
    expect(r).toMatchInlineSnapshot(`
      Task {
        "category": null,
        "id": 1,
        "shouldNotSee": "",
        "status": status {
          "caption": "Not Ok",
          "id": "notOk",
        },
        "title": "test",
      }
    `)
  })
  it("works with array",()=>{
    const r = repo.toJson([task1,task2])
    expect (r.length).toBe(2)
    const rr = repo.fromJson(r);
    expect (rr.length).toBe(2)
  })

})


