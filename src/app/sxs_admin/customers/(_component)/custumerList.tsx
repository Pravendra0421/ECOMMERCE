// src/app/sxs_admin/(_component)/Dashboard.tsx
"use client";
import React from "react";
import { FaUsers } from "react-icons/fa";
import { DashboardDto } from "@/core/dtos/Dashboard.dto";

// Interface remains the same
interface DashboardProps {
  dashboardData: DashboardDto;
}

const Dashboard = ({ dashboardData }: DashboardProps) => {
  if (!dashboardData) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center ">
        <p className="text-gray-600">
          Loading data or no dashboard data available.
        </p>
      </div>
    );
  }
  return (
    <div className="w-full ">
      <h1 className="text-gray-800 font-bold text-4xl mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 border mt-5 border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FaUsers className="mr-2 text-pink-500" />
            Customers
          </h2>
          {dashboardData.userDetail && dashboardData.userDetail.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      user ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FirstName
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LastName
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      createdAt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.userDetail.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.firstName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.lastName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No user found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
