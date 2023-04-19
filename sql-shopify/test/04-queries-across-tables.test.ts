import { Database } from "../src/database";
import { minutes } from "./utils";

describe("Queries Across Tables", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("03", "04");
    }, minutes(1));

    it("should select count of apps which have free pricing plan", async done => {
        const query = `SELECT COUNT(*) AS count
        FROM APPS
        JOIN apps_pricing_plans ON apps.id = apps_pricing_plans.app_id
        JOIN pricing_plans ON pricing_plans.id = apps_pricing_plans.pricing_plan_id
        WHERE pricing_plans.price LIKE 'Free%'`;
        const result = await db.selectSingleRow(query);
        expect(result).toEqual({
            count: 1112
        });
        done();
    }, minutes(1));

    it("should select top 3 most common categories", async done => {
        const query = `SELECT COUNT(*) as count, categories.title as category
        FROM apps_categories
        JOIN categories on apps_categories.category_id = categories.id
        GROUP by apps_categories.category_id
        ORDER by count DESC
        LIMIT 3`;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 1193, category: "Store design" },
            { count: 723, category: "Sales and conversion optimization" },
            { count: 629, category: "Marketing" }
        ]);
        done();
    }, minutes(1));

    it("should select top 3 prices by appearance in apps and in price range from $5 to $10 inclusive (not matters monthly or one time payment)", async done => {
        const query = `SELECT COUNT(*) AS count, pricing_plans.price AS price, CAST(REPLACE(pricing_plans.price, '$', '') AS decimal) AS casted_price
        FROM APPS_PRICING_PLANS
        JOIN pricing_plans ON APPS_PRICING_PLANS.pricing_plan_id = pricing_plans.id
        WHERE casted_price BETWEEN 5.0 AND 10.0
        GROUP BY casted_price
        ORDER BY count DESC
        LIMIT 3`;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 225, price: "$9.99/month", casted_price: 9.99 },
            { count: 135, price: "$5/month", casted_price: 5 },
            { count: 114, price: "$10/month", casted_price: 10 }
        ]);
        done();
    }, minutes(1));
});