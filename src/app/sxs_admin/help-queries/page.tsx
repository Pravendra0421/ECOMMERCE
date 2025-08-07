"use client";
import React, { useEffect, useState } from "react";
import { HelpQueryApiRepository } from "@/infrastructure/frontend/repositories/HelpQueryApi";
import { HelpQueryEntity } from "@/core/entities/helpQuery.entity";

const helpQueryRepo = new HelpQueryApiRepository();

const AdminHelpQueriesPage = () => {
  const [helpQueries, setHelpQueries] = useState<HelpQueryEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const queries = await helpQueryRepo.getAllHelpQueries();
        console.log(queries);
        setHelpQueries(queries);
      } catch (err) {
        alert("Failed to fetch help queries");
      } finally {
        setLoading(false);
      }
    };
    fetchQueries();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Help Queries</h1>
      {loading ? (
        <div>Loading...</div>
      ) : helpQueries.length === 0 ? (
        <div>No help queries found.</div>
      ) : (
        <ul>
          {helpQueries.map((q) => (
            <li key={q.id} className="mb-4 border-b pb-2">
              <div className="font-semibold">{q.userEmail}</div>
              <div>{q.query}</div>
              <div className="text-xs text-gray-500">
                {new Date(q.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminHelpQueriesPage;
